export class ErrCannotSignTransactions extends Error {
  public constructor() {
    super("Cannot sign transaction(s)");
  }
}

export class ErrCannotSignMessage extends Error {
  public constructor() {
    super("Cannot sign message");
  }
}
