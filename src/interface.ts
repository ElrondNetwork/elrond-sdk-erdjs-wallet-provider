export interface ITransaction {
  toPlainObject(): any;
}

export interface ISignableMessage {
  message: Buffer;
}
