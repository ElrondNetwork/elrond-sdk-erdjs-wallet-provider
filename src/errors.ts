/**
 * The base class for exceptions (errors).
 */
 export class Err extends Error {
    inner: Error | undefined = undefined;

    public constructor(message: string, inner?: Error) {
        super(message);
        this.inner = inner;
    }
}

/**
 * Signals that the data inside the url is not a valid one for a transaction sign response
 */
 export class ErrInvalidTxSignReturnValue extends Err {
    public constructor() {
      super("Invalid response in transaction sign return url");
    }
  }
