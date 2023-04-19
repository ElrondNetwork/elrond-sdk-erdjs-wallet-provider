export class PlainSignedTransaction {
  nonce: number = 0;
  value: string = "";
  receiver: string = "";
  sender: string = "";
  gasPrice: number = 0;
  gasLimit: number = 0;
  data: string = "";
  chainID: string = "";
  version: number = 0;
  options?: number = undefined;
  signature: string = "";
  guardian?: string;
  guardianSignature?: string;

  constructor(init?: Partial<PlainSignedTransaction>) {
    Object.assign(this, init);
  }
}
