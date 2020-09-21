import PWCore, { Provider, Platform, Blake2bHasher } from '@lay2/pw-core';
import { LocalStorage } from 'quasar';
import { ec as EC } from 'elliptic/';

export default class BurnerProvider extends Provider {
  ec: EC;
  constructor() {
    super(Platform.ckb);
    this.ec = new EC('secp256k1');
  }

  async init(): Promise<Provider> {
    let keypair: EC.KeyPair;
    if (LocalStorage.has('privkey')) {
      const privkey = LocalStorage.getItem('privkey') as string;
      keypair = this.ec.keyFromPrivate(privkey);
    } else {
      keypair = await keygen(this.ec);
      LocalStorage.set('privkey', keypair.getPrivate('hex'));
    }
    const lock = PWCore.config.defaultLock.script;
    lock.args = new Blake2bHasher()
      .hash(`0x${keypair.getPublic(true, 'hex')}`)
      .serializeJson()
      .slice(0, 42);
    this.address = lock.toAddress();
    return this;
  }
}

async function keygen(ec: EC): Promise<EC.KeyPair> {
  return new Promise<EC.KeyPair>((resolve, reject) => {
    try {
      const keypair = ec.genKeyPair();
      resolve(keypair);
    } catch (e) {
      reject(e);
    }
  });
}
