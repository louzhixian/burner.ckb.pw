import PWCore, {
  Builder,
  Transaction,
  Address,
  Amount,
  Cell,
  RawTransaction
} from '@lay2/pw-core';

export default class BurnerBuilder extends Builder {
  constructor(private address: Address) {
    super();
  }
  async build(lastFee = new Amount('0')): Promise<Transaction> {
    const inputCells = await this.collector.collect(PWCore.provider.address);
    const inputAmount = inputCells
      .map(c => c.capacity)
      .reduce((sum, a) => sum.add(a));

    let neededAmount = Builder.MIN_CHANGE.add(lastFee);
    if (inputAmount.lt(neededAmount)) {
      throw new Error('capacity is not enough');
    }

    const outputCell = new Cell(inputAmount, this.address.toLockScript());

    const tx = new Transaction(new RawTransaction(inputCells, [outputCell]), [
      Builder.WITNESS_ARGS.Secp256k1
    ]);

    this.fee = Builder.calcFee(tx);
    neededAmount = Builder.MIN_CHANGE.add(this.fee);
    if (inputAmount.gte(neededAmount)) {
      tx.raw.outputs[0].capacity = inputAmount.sub(this.fee);
      return tx;
    }

    return this.build(this.fee);
  }
}
