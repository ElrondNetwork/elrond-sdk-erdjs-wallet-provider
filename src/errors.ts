export class ErrCannotGetSignedTransactions extends Error {
  public constructor() {
    super("Cannot get signed transaction(s)");
  }
}

export class ErrCannotSignedMessage extends Error {
  public constructor() {
    super("Cannot get signed message");
  }
}
