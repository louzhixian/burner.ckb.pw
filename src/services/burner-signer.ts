import { Signer, Blake2bHasher, Message, hexToByteArray } from '@lay2/pw-core';
import { ec as EC } from 'elliptic';
import { LocalStorage } from 'quasar';
export default class BurnerSigner extends Signer {
  constructor() {
    super(new Blake2bHasher());
  }

  protected signMessages(messages: Message[]): Promise<string[]> {
    if (!LocalStorage.has('privkey')) {
      throw new Error('No CKB account found, please create one first!');
    }
    const keypair = new EC('secp256k1').keyFromPrivate(
      LocalStorage.getItem('privkey') as string
    );
    return new Promise<string[]>((resolve, reject) => {
      try {
        for (let i = 0; i < messages.length; i++) {
          const msg = hexToByteArray(messages[i].message);
          const { r, s, recoveryParam } = keypair.sign(msg, {
            canonical: true
          });
          if (recoveryParam === null)
            throw new Error('failed to sign the transaction!');
          const fmtR = r.toString(16).padStart(64, '0');
          const fmtS = s.toString(16).padStart(64, '0');

          messages[i].message = `0x${fmtR}${fmtS}0${recoveryParam}`;
        }
        resolve(messages.map(m => m.message));
      } catch (e) {
        reject(e);
      }
    });
  }
}
