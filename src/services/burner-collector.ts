/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Collector,
  Address,
  Amount,
  Cell,
  AmountUnit,
  Script,
  OutPoint
} from '@lay2/pw-core';

export default class BurnerCollector extends Collector {
  indexerUrl = 'https://lay2.ckb.dev/indexer';

  constructor() {
    super();
  }
  getBalance(): Promise<Amount> {
    throw new Error('Method not implemented.');
  }
  async collect(address: Address): Promise<Cell[]> {
    const cells: Cell[] = [];
    const { result } = await (
      await fetch(this.indexerUrl, {
        method: 'POST',
        body: JSON.stringify(this.getParams(address)),
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })
    ).json();

    console.log('[sd-collector] result', result);

    for (const rawCell of result.objects) {
      const cell = new Cell(
        new Amount(rawCell.output.capacity, AmountUnit.shannon),
        Script.fromRPC(rawCell.output.lock) as Script,
        Script.fromRPC(rawCell.output.type),
        OutPoint.fromRPC(rawCell.out_point),
        rawCell.output_data
      );

      cells.push(cell);
    }
    return cells;
  }

  getParams(address: Address) {
    return {
      id: 2,
      jsonrpc: '2.0',
      method: 'get_cells',
      params: [
        {
          script: address.toLockScript().serializeJson(),
          script_type: 'lock'
        },
        'asc',
        '0x2710'
      ]
    };
  }
}
