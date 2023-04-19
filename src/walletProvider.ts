import qs from "qs";
import {
    WALLET_PROVIDER_CALLBACK_PARAM,
    WALLET_PROVIDER_CALLBACK_PARAM_TX_SIGNED,
    WALLET_PROVIDER_CONNECT_URL,
    WALLET_PROVIDER_DISCONNECT_URL,
    WALLET_PROVIDER_SIGN_MESSAGE_URL,
    WALLET_PROVIDER_SIGN_TRANSACTION_URL,
    WALLET_PROVIDER_GUARD_TRANSACTION_URL
} from "./constants";
import { ErrCannotGetSignedTransactions, ErrCannotSignedMessage } from "./errors";
import { ISignableMessage, ITransaction } from "./interface";
import { PlainSignedTransaction } from "./plainSignedTransaction";

export class WalletProvider {
    private readonly walletUrl: string;

    /**
     * Creates a new WalletProvider
     * @param walletURL
     */
    constructor(walletURL: string) {
        this.walletUrl = walletURL;
    }

    /**
     * Fetches the login hook url and redirects the client to the wallet login.
     */
    async login(options?: { callbackUrl?: string; token?: string, redirectDelayMilliseconds?: number }): Promise<string> {
        const redirectUrl = this.buildWalletUrl({
            endpoint: WALLET_PROVIDER_CONNECT_URL,
            callbackUrl: options?.callbackUrl,
            params: {
                token: options?.token
            }
        });

        await this.redirect(redirectUrl, options?.redirectDelayMilliseconds);
        return redirectUrl;
    }

    private async redirect(url: string, delayMilliseconds?: number) {
        if (delayMilliseconds) {
            await this.redirectLater(url, delayMilliseconds);
        } else {
            this.redirectImmediately(url)
        }
    }

    private redirectImmediately(url: string) {
        window.location.href = url;
    }

    private async redirectLater(url: string, delayMilliseconds: number) {
        await new Promise((resolve) => {
            setTimeout(() => {
                window.location.href = url;
                resolve(true);
            }, delayMilliseconds);
        });
    }

    /**
    * Fetches the logout hook url and redirects the client to the wallet logout.
    */
    async logout(options?: { callbackUrl?: string, redirectDelayMilliseconds?: number }): Promise<boolean> {
        const redirectUrl = this.buildWalletUrl({
            endpoint: WALLET_PROVIDER_DISCONNECT_URL,
            callbackUrl: options?.callbackUrl
        });

        await this.redirect(redirectUrl, options?.redirectDelayMilliseconds);
        return true;
    }


    /**
     * Packs a {@link SignMessage} and fetches correct redirect URL from the wallet API. Then redirects
     * the client to the sign message hook
     * @param message
     * @param options
     */
    async signMessage(message: ISignableMessage, options?: { callbackUrl?: string }): Promise<string> {
        const redirectUrl = this.buildWalletUrl({
            endpoint: WALLET_PROVIDER_SIGN_MESSAGE_URL,
            callbackUrl: options?.callbackUrl,
            params: {
                message: message.message.toString()
            }
        });

        await this.redirect(redirectUrl);
        return redirectUrl;
    }

    getMessageSignatureFromWalletUrl(): string {
        const url = window.location.search.slice(1);
        console.info("getMessageSignatureFromWalletUrl(), url:", url);

        const urlParams = qs.parse(url);
        const status = urlParams.status?.toString() || "";
        const expectedStatus = "signed";

        if (status !== expectedStatus) {
            throw new ErrCannotSignedMessage();
        }

        const signature = urlParams.signature?.toString() || "";
        return signature;
    }

     /**
     * Packs an array of {$link Transaction} and redirects to the 2fa hook
     *  
     * @param transactions
     * @param options
     */
    async guardTransactions(transactions: ITransaction[], options?: { callbackUrl?: string }): Promise<void> {
        this.redirectTransactionsToEndpoint(WALLET_PROVIDER_GUARD_TRANSACTION_URL, transactions, options);
    }

     /**
     * Packs an array of {$link Transaction} and redirects to the correct transaction sigining hook
     *  
     * @param transactions
     * @param options
     */
    async signTransactions(transactions: ITransaction[], options?: { callbackUrl?: string }): Promise<void> {
        this.redirectTransactionsToEndpoint(WALLET_PROVIDER_SIGN_TRANSACTION_URL, transactions, options);
    }

    /**
     * Packs a {@link Transaction} and fetches correct redirect URL from the wallet API. Then redirects
     *   the client to the sign transaction hook
     * @param transaction
     * @param options
     */
    async signTransaction(transaction: ITransaction, options?: { callbackUrl?: string }): Promise<void> {
        await this.signTransactions([transaction], options);
    }

    getTransactionsFromWalletUrl(): PlainSignedTransaction[] {
        const urlParams = qs.parse(window.location.search.slice(1));
        if (!WalletProvider.isTxSignReturnSuccess(urlParams)) {
            return [];
        }

        return this.getTxSignReturnValue(urlParams);
    }

    static isTxSignReturnSuccess(urlParams: any): boolean {
        return urlParams.hasOwnProperty(WALLET_PROVIDER_CALLBACK_PARAM) && urlParams[WALLET_PROVIDER_CALLBACK_PARAM] === WALLET_PROVIDER_CALLBACK_PARAM_TX_SIGNED;
    }

    private getTxSignReturnValue(urlParams: any): PlainSignedTransaction[] {
        console.info("getTxSignReturnValue(), urlParams:", urlParams);

        // "options", "data", "guardian", "guardianSignature" properties are optional (it isn't always received from the Web Wallet)
        const expectedProps = ["nonce", "value", "receiver", "sender", "gasPrice",
            "gasLimit", "chainID", "version", "signature"];

        for (let txProp of expectedProps) {
            if (!urlParams[txProp] || !Array.isArray(urlParams[txProp])) {
                throw new ErrCannotGetSignedTransactions();
            }
        }

        const expectedLength = urlParams["nonce"].length;
        for (let txProp of expectedProps) {
            if (urlParams[txProp].length !== expectedLength) {
                throw new ErrCannotGetSignedTransactions();
            }
        }

        const transactions: PlainSignedTransaction[] = [];

        for (let i = 0; i < expectedLength; i++) {
            let plainSignedTransaction = new PlainSignedTransaction({
                nonce: parseInt(urlParams["nonce"][i]),
                value: urlParams["value"][i],
                receiver: urlParams["receiver"][i],
                sender: urlParams["sender"][i],
                gasPrice: parseInt(urlParams["gasPrice"][i]),
                gasLimit: parseInt(urlParams["gasLimit"][i]),
                // Handle the optional "data" property.
                data: urlParams["data"][i] ?? "",
                chainID: urlParams["chainID"][i],
                version: parseInt(urlParams["version"][i]),
                ...(urlParams["guardian"] && urlParams["guardian"][i] ? {guardian: urlParams["guardian"][i]} : {}),
                ...(urlParams["guardianSignature"] && urlParams["guardianSignature"][i] ? {guardianSignature: urlParams["guardianSignature"][i]} : {}),
                // Handle the optional "options" property.
                ...(urlParams["options"] && urlParams["options"][i] ? {
                    options: parseInt(urlParams["options"][i])
                } : {}),
                
                signature: urlParams["signature"][i]
            });

            transactions.push(plainSignedTransaction);
        }

        return transactions;
    }

    static prepareWalletTransaction(transaction: ITransaction): any {
        let plainTransaction = transaction.toPlainObject();

        // We adjust the data field, in order to make it compatible with what the web wallet expects.
        if (plainTransaction.data) {
            plainTransaction.data = Buffer.from(plainTransaction.data, "base64").toString();
        } else {
            // The web wallet expects the data field to be a string, even if it's empty (early 2023).
            plainTransaction.data = "";
        }

        return plainTransaction;
    }

    private buildWalletUrl(options: { endpoint: string, callbackUrl?: string, params?: any }): string {
        const callbackUrl = options?.callbackUrl || window.location.href;
        const partialQueryString = qs.stringify(options.params || {});
        const fullQueryString = partialQueryString ? `${partialQueryString}&callbackUrl=${callbackUrl}` : `callbackUrl=${callbackUrl}`;
        const url = `${this.baseWalletUrl()}/${options.endpoint}?${fullQueryString}`;

        console.info(`Redirecting to Wallet URL: ${decodeURI(url)}`);

        return url;
    }

    private baseWalletUrl(): string {
        const pathArray = this.walletUrl.split('/');
        const protocol = pathArray[0];
        const host = pathArray[2];
        return protocol + '//' + host;
    }

    /**
     * Packs an array of {$link Transaction} and redirects to the specified wallet hook
     *  
     * @param transactions
     * @param options
     */
    private redirectTransactionsToEndpoint(endpoint:string, transactions: ITransaction[], options?: { callbackUrl?: string }): void {
        const jsonToSend: any = {};
        transactions.map(tx => {
            let plainTx = WalletProvider.prepareWalletTransaction(tx);
            for (let txProp in plainTx) {
                if (plainTx.hasOwnProperty(txProp) && !jsonToSend.hasOwnProperty(txProp)) {
                    jsonToSend[txProp] = [];
                }

                jsonToSend[txProp].push(plainTx[txProp]);
            }
        });

        const redirectUrl = this.buildWalletUrl({
            endpoint,
            callbackUrl: options?.callbackUrl,
            params: jsonToSend
        });

        window.location.href = redirectUrl;
    }
}
