export interface IDappProvider {
    init(): Promise<boolean>;
    login(options?: {callbackUrl?: string; token?: string; addressIndex?: number}): Promise<string>;
    logout(options?: {callbackUrl?: string}): Promise<boolean>;
    getAddress(): Promise<string>;
    isInitialized(): boolean;
    isConnected(): Promise<boolean>;
    sendTransaction(transaction: ITransaction, options?: {callbackUrl?: string}): Promise<void>;
    signTransaction(transaction: ITransaction, options?: {callbackUrl?: string}): Promise<void>;
    signTransactions(transaction: Array<ITransaction>, options?: {callbackUrl?: string}): Promise<void>;
    signMessage(transaction: ISignableMessage, options?: {callbackUrl?: string}): Promise<void>;
}

export interface ISignature {
    hex(): string;
}

export interface IAddress {
    bech32(): string;
}

export interface ITransaction {
    toPlainObject(): any;
}

export interface ISignedTransaction {
}

export interface ISignableMessage {
}

export interface ITransactionFactory {
    fromPlainObject(obj: any): ISignedTransaction;
}
