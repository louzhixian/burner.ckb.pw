<template>
<div>
  <span class="text-grey text-subtitle1">All CKB sent to: </span>
  <p class="text-h6">{{address}}</p>
  <span class="text-grey text-subtitle1">Will be automatically forwarded to: </span>
  <q-input v-model="target" standout clearable dense type="text" autogrow style="font-size: 1.3em" />
  <p />
  <q-separator spaced />
  <span class="text-grey text-subtitle1">Relayed Transactions {{loading ? '(checking..)' : ''}} :</span>
  <p v-if="txHash.length" class="text-h6 text-accent">Relayed {{balance}} CKB at {{txHash}} </p>
  <p v-else-if="balance.length" class="text-h6 text-warning">Relaying {{balance}} CKB... </p>
  <p v-else class="text-h6 text-grey">Not yet</p>
  <q-btn color="primary" icon="check" label="Send" @click="send" />
</div>
</template>

<script lang="ts">
import {Vue, Component} from 'vue-property-decorator'
import PWCore, {CHAIN_SPECS, AmountUnit, Cell, ChainID, AddressType, Address} from '@lay2/pw-core'
import BurnerProvider from '../services/burner-provider'
import BurnerCollector from '../services/burner-collector'
import BurnerBuilder from '../services/burner-builder'
import BurnerSigner from '../services/burner-signer'

@Component
export default class CkbBurner extends Vue {
  pw = new PWCore('https://lay2.ckb.dev');
  loading= false;
  address = '';
  target = '';
  txHash = '';
  cells: Cell[] = [];
  checker: NodeJS.Timeout | null = null; 

  async mounted() {
    this.pw = await this.pw.init(
      new BurnerProvider(),
      new BurnerCollector(),
      ChainID.ckb_dev,
      CHAIN_SPECS.Lay2
    );
    this.address = PWCore.provider.address.addressString;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.checker = setInterval(async () => await this.check(), 3000);
  }

  destroyed() {
    this.checker && clearInterval(this.checker);
  }

  get balance(): string {
    if(this.cells.length) {
      return this.cells.map(c => c.capacity).reduce((sum, a) => sum.add(a)).toString(AmountUnit.ckb, {commify: true})
    }
    return '';
  }

  async check() {
    this.loading = true;
    const cells = await new BurnerCollector().collect(PWCore.provider.address)
    if(cells && cells.length) {
      await this.send();
    }
    this.loading = false;
  }

  async send() {
    this.txHash = await this.pw.sendTransaction(
      new BurnerBuilder(new Address(this.target.trim(), AddressType.ckb)),
      new BurnerSigner()
    );
  }
}
</script>
