import qs from "qs";
import { IDappProvider, ISignableMessage, ITransaction } from "./interface";
import {
    WALLET_PROVIDER_CALLBACK_PARAM,
    WALLET_PROVIDER_CALLBACK_PARAM_TX_SIGNED,
    WALLET_PROVIDER_CONNECT_URL,
    WALLET_PROVIDER_DISCONNECT_URL,
    WALLET_PROVIDER_SEND_TRANSACTION_URL,
    WALLET_PROVIDER_SIGN_TRANSACTION_URL,
} from "./constants";
import { ErrInvalidTxSignReturnValue, ErrNotImplemented } from "./errors";
import { Signature } from "./signature";
import { UserAddress } from "./userAddress";

interface TransactionMessage {
    receiver: string;
    value: string;
    gasPrice?: number;
    gasLimit?: number;
    data?: string;
    nonce?: number;
    options?: number;
}

export class WalletProvider implements IDappProvider {
    walletUrl: string;

    /**
     * Creates a new WalletProvider
     * @param walletURL
     */
    constructor(walletURL: string) {
        this.walletUrl = walletURL;
    }

    /**
     * Waits for the wallet iframe to ping that it has been initialised
     */
    async init(): Promise<boolean> {
        return true;
    }

    /**
     * Returns if the wallet iframe is up and running
     */
    isInitialized(): boolean {
        return true;
    }

    /**
     * Unlike isInitialized, isConnected returns true if the user alredy went through the login process
     *  and has the wallet session active
     */
    async isConnected(): Promise<boolean> {
        return false;
    }

    /**
     * Fetches the login hook url and redirects the client to the wallet login.
     */
    async login(options?: { callbackUrl?: string; token?: string }): Promise<string> {
        let callbackUrl = `callbackUrl=${window.location.href}`;
        if (options && options.callbackUrl) {
            callbackUrl = `callbackUrl=${options.callbackUrl}`;
        }

        let token = '';
        if (options && options.token) {
            token = `&token=${options.token}`;
        }

        const redirect = `${this.baseWalletUrl()}${WALLET_PROVIDER_CONNECT_URL}?${callbackUrl}${token}`;
        await new Promise((resolve) => {
            setTimeout(() => {
              window.location.href = redirect;
              resolve(true);
            }, 10);
          });

        return window.location.href;
    }

    /**
    * Fetches the logout hook url and redirects the client to the wallet logout.
    */
    async logout(options?: { callbackUrl?: string }): Promise<boolean> {
        let callbackUrl = `callbackUrl=${window.location.href}`;
        if (options && options.callbackUrl) {
            callbackUrl = `callbackUrl=${options.callbackUrl}`;
        }

        const redirect = `${this.baseWalletUrl()}${WALLET_PROVIDER_DISCONNECT_URL}?${callbackUrl}`;
        await new Promise((resolve) => {
            setTimeout(() => {
              window.location.href = redirect;
              resolve(true);
            }, 10);
          });

        return true;
    }

    /**
     * Returns currently connected address. Empty string if not connected
     */
    async getAddress(): Promise<string> {
        throw new ErrNotImplemented();
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the send transaction hook
     * @param transaction
     * @param options
     */
    async sendTransaction(transaction: ITransaction, options?: { callbackUrl?: string }): Promise<ITransaction> {
        let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
        let url = `${this.baseWalletUrl()}${WALLET_PROVIDER_SEND_TRANSACTION_URL}?${this.buildTransactionUrl(plainTransaction)}`;

        window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
        return transaction;
    }

    /**
     * Packs an array of {$link Transaction} and redirects to the correct transaction sigining hook
     *
     * @param transactions
     * @param options
     */
    async signTransactions(transactions: ITransaction[], options?: { callbackUrl?: string }): Promise<ITransaction[]> {
        const jsonToSend: any = {};
        transactions.map(tx => {
            let plainTx =  WalletProvider.prepareWalletTransaction(tx);
            for ( let txProp in plainTx ) {
                if (plainTx.hasOwnProperty(txProp) && !jsonToSend.hasOwnProperty(txProp)) {
                    jsonToSend[txProp] = [];
                }

                jsonToSend[txProp].push(plainTx[txProp]);
            }
        });

        let url = `${this.baseWalletUrl()}${WALLET_PROVIDER_SIGN_TRANSACTION_URL}?${qs.stringify(jsonToSend)}`;
        window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
        return transactions;
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the sign transaction hook
     * @param transaction
     * @param options
     */
    async signTransaction(transaction: ITransaction, options?: { callbackUrl?: string }): Promise<ITransaction> {
        let plainTransaction = WalletProvider.prepareWalletTransaction(transaction);
        let url = `${this.baseWalletUrl()}${WALLET_PROVIDER_SIGN_TRANSACTION_URL}?${this.buildTransactionUrl(plainTransaction)}`;

        window.location.href = `${url}&callbackUrl=${options !== undefined && options.callbackUrl !== undefined ? options.callbackUrl : window.location.href}`;
        return transaction;
    }

    getTransactionsFromWalletUrl(): ITransaction[] {
        const transactions: ITransaction[] = [];
        const urlParams = qs.parse(window.location.search.slice(1));
        if (!WalletProvider.isTxSignReturnSuccess(urlParams)) {
            return transactions;
        }

        return WalletProvider.getTxSignReturnValue(urlParams);
    }

    /**
     * Method will be available once the ElrondWallet hook will be implemented
     * @param _
     */
    async signMessage(_: ISignableMessage): Promise<ISignableMessage> {
        throw new ErrNotImplemented();
    }

    static isTxSignReturnSuccess(urlParams: any): boolean {
        return urlParams.hasOwnProperty(WALLET_PROVIDER_CALLBACK_PARAM) && urlParams[WALLET_PROVIDER_CALLBACK_PARAM] === WALLET_PROVIDER_CALLBACK_PARAM_TX_SIGNED;
    }

    static getTxSignReturnValue(urlParams: any): ITransaction[] {
        // "options" property is optional (it isn't always received from the Web Wallet)
        const expectedProps = ["nonce", "value", "receiver", "sender", "gasPrice",
            "gasLimit", "data", "chainID", "version", "signature"];

        for (let txProp of expectedProps) {
            if (!urlParams[txProp] || !Array.isArray(urlParams[txProp])) {
                throw new ErrInvalidTxSignReturnValue();
            }
        }

        const expectedLength = urlParams["nonce"].length;
        for (let txProp of expectedProps) {
            if (urlParams[txProp].length !== expectedLength) {
                throw new ErrInvalidTxSignReturnValue();
            }
        }

        const transactions: ITransaction[] = [];
        for (let i = 0; i < expectedLength; i++) {
            let plainObject = {
                nonce: parseInt(urlParams["nonce"][i]),
                value: urlParams["value"][i],
                receiver: urlParams["receiver"][i],
                gasPrice: parseInt(urlParams["gasPrice"][i]),
                gasLimit: parseInt(urlParams["data"][i]),
                data: urlParams["data"][i],
                chainID: urlParams["chainID"][i],
                version: parseInt(urlParams["version"][i]),
                // Handle the optional "options" property.
                ...(urlParams["options"] && urlParams["options"][i] ? {
                    options: parseInt(urlParams["options"][i])
                } : {})
            };

            let signature = Signature.fromHex(urlParams["signature"][i]);
            let signedBy = new UserAddress(urlParams["sender"][i]);

            let tx = {};  // TODO: factory.fromPlainObject.
            tx.applySignature(signature, signedBy);
            transactions.push(tx);
        }

        return transactions;
    }

    static prepareWalletTransaction(transaction: ITransaction): any {
        let plainTransaction = transaction.toPlainObject();

        // We adjust the data field, in order to make it compatible with what the web wallet expects.
        if (plainTransaction.data) {
            plainTransaction.data = Buffer.from(plainTransaction.data, "base64").toString();
        }

        return plainTransaction;
    }

    private buildTransactionUrl(transaction: TransactionMessage): string {
        let urlString = `receiver=${transaction.receiver}&value=${transaction.value}`;
        if (transaction.gasLimit) {
            urlString += `&gasLimit=${transaction.gasLimit}`;
        }
        if (transaction.gasPrice) {
            urlString += `&gasPrice=${transaction.gasPrice}`;
        }
        if (transaction.data) {
            urlString += `&data=${transaction.data}`;
        }
        if (transaction.nonce || transaction.nonce === 0) {
            urlString += `&nonce=${transaction.nonce}`;
        }

        return urlString;
    }

    private baseWalletUrl(): string {
        const pathArray = this.walletUrl.split('/');
        const protocol = pathArray[0];
        const host = pathArray[2];
        return protocol + '//' + host;
    }
}
