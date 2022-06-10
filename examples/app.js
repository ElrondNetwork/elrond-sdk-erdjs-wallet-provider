import qs from "qs";
import { WalletProvider, WALLET_PROVIDER_TESTNET } from "../src";

export async function login() {
    let provider = createProvider();
    await provider.login();
}

function createProvider() {
    return new WalletProvider(WALLET_PROVIDER_TESTNET);
}

export async function showAddress() {
    alert(getAddress() || "Try to login first.");
}

function getAddress() {
    let params = qs.parse(getQueryString());
    return params.address;
}

function getQueryString() {
    return window.location.search.slice(1);
}

export async function signTransactions() {
    let provider = createProvider();

    let firstTransaction = {
        toPlainObject: function () {
            return {
                nonce: 42,
                value: "1",
                receiver: "erd1uv40ahysflse896x4ktnh6ecx43u7cmy9wnxnvcyp7deg299a4sq6vaywa",
                gasPrice: 1000000000,
                gasLimit: 70000,
                data: Buffer.from("hello").toString("base64"),
                chainID: "T",
                version: 1
            };
        }
    };

    let secondTransaction = {
        toPlainObject: function () {
            return {
                nonce: 43,
                value: "1",
                receiver: "erd1uv40ahysflse896x4ktnh6ecx43u7cmy9wnxnvcyp7deg299a4sq6vaywa",
                gasPrice: 1000000000,
                gasLimit: 70000,
                data: Buffer.from("world").toString("base64"),
                chainID: "T",
                version: 1
            };
        }
    };

    await provider.signTransactions([firstTransaction, secondTransaction]);
}

/**
 * In production, if needed, one can use erdjs' `Transaction.fromPlainObject()` to wrap the plain transaction objects returned by the provider. 
 * 
 * For example: 
 *
 * ```
 * let plainSignedTransactions = provider.getTransactionsFromWalletUrl();
 * let transactions = plainSignedTransactions.map(item => Transaction.fromPlainObject(item));
 * ```
 */
export async function showSignedTransactions() {
    let provider = createProvider();
    let plainSignedTransactions = provider.getTransactionsFromWalletUrl();

    alert(JSON.stringify(plainSignedTransactions, null, 4));
}

export async function logout() {
    let provider = createProvider();
    await provider.logout({ callbackUrl: window.location.href, redirectDelayMilliseconds: 10 });
}
