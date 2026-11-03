import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export class SignerService {
  private keyPair: nacl.SignKeyPair;
  private publicKeyHex: string;

  constructor() {
    // Gera par de chaves Ed25519 para a prefeitura / orquestrador municipal
    this.keyPair = nacl.sign.keyPair();
    this.publicKeyHex = Buffer.from(this.keyPair.publicKey).toString('hex');
  }

  public getPublicKey(): string {
    return this.publicKeyHex;
  }

  /**
   * Assina digitalmente qualquer objeto payload usando Ed25519
   */
  public signPayload(payload: object): string {
    const serialized = JSON.stringify(payload);
    const messageBytes = naclUtil.decodeUTF8(serialized);
    const signature = nacl.sign.detached(messageBytes, this.keyPair.secretKey);
    return `ed25519:${Buffer.from(signature).toString('hex')}`;
  }

  /**
   * Valida a assinatura de um payload com uma chave publica
   */
  public static verifySignature(payload: object, signatureString: string, publicKeyHex: string): boolean {
    try {
      if (!signatureString.startsWith('ed25519:')) return false;
      const sigHex = signatureString.replace('ed25519:', '');
      const signatureBytes = Buffer.from(sigHex, 'hex');
      const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
      const serialized = JSON.stringify(payload);
      const messageBytes = naclUtil.decodeUTF8(serialized);

      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }
}
