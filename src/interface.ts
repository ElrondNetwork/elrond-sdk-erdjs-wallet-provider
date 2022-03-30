export interface ITransaction {
    toPlainObject(): any;
}

export interface ISignedTransaction {
}

export interface ITransactionFactory {
    fromPlainObject(obj: any): ISignedTransaction;
}
