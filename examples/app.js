import qs from "qs";
import { WalletProvider } from "../out/walletProvider";
import { WALLET_PROVIDER_TESTNET } from "../out/constants";

export async function login() {
    let provider = createProvider();
    await provider.login();
}

function createProvider() {
    return new WalletProvider(WALLET_PROVIDER_TESTNET, new TestTransactionFactory());
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

export async function showSignedTransactions() {
    let provider = createProvider();
    let transactions = provider.getTransactionsFromWalletUrl();
    alert(JSON.stringify(transactions, null, 4));
}

class TestTransactionFactory {
    fromPlainObject(obj) {
        console.log("transactionFactory.fromPlainObject()");
        console.log(obj);
        // In production, if using erdjs, a Transaction object could be created & returned.
        return obj;
    }
}
