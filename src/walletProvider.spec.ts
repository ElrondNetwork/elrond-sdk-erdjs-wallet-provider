import { assert } from "chai";
import { ITransaction } from "./interface";
import { WalletProvider } from "./walletProvider";

declare global {
  namespace NodeJS {
    interface Global {
      window?: {
        location: {
          href: string
        }
      };
    }
  }
}

describe("test wallet provider", () => {
  beforeEach(function() {
    let window: any = {
      location: {
        href: "http://return-to-wallet"
      }
    };

    global.window = window;
  });

  it('login redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");

    const returnUrl = await walletProvider.login();
    assert.equal(decodeURI(returnUrl), "http://mocked-wallet.com/hook/login?callbackUrl=http://return-to-wallet");

    const returnUrlWithCallback = await walletProvider.login({callbackUrl: "http://another-callback"});
    assert.equal(returnUrlWithCallback, "http://mocked-wallet.com/hook/login?callbackUrl=http://another-callback");

    const returnUrlWithToken = await walletProvider.login({callbackUrl: "http://another-callback", token: "test-token"});
    assert.equal(returnUrlWithToken, "http://mocked-wallet.com/hook/login?callbackUrl=http://another-callback&token=test-token");
  });

  it('logout redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");

    await walletProvider.logout();
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/logout?callbackUrl=http://return-to-wallet");

    await walletProvider.logout({callbackUrl: "http://another-callback"});
    assert.equal(window.location.href, "http://mocked-wallet.com/hook/logout?callbackUrl=http://another-callback");
  });

  it('sign transaction redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");
    const mockTransaction = new TestTransaction({
      receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      value: "0",
      gasLimit: 50000,
      gasPrice: 1000000000
    });

    await walletProvider.signTransaction(mockTransaction);
    assert.equal(decodeURI(window.location.href), "http://mocked-wallet.com/hook/sign?nonce[0]=0&value[0]=0&receiver[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[0]=&gasPrice[0]=1000000000&gasLimit[0]=50000&data[0]=&chainID[0]=&version[0]=1&callbackUrl=http://return-to-wallet");

    await walletProvider.signTransaction(mockTransaction, {callbackUrl: "http://another-callback"});
    assert.equal(decodeURI(window.location.href), "http://mocked-wallet.com/hook/sign?nonce[0]=0&value[0]=0&receiver[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[0]=&gasPrice[0]=1000000000&gasLimit[0]=50000&data[0]=&chainID[0]=&version[0]=1&callbackUrl=http://another-callback");
  });

  it('sign multiple transactions redirects correctly', async () => {
    const walletProvider = new WalletProvider("http://mocked-wallet.com");
    const mockTransactions = [
      new TestTransaction({
        receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
        sender: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
        value: "0",
        gasLimit: 50000,
        gasPrice: 1000000000,
        chainID: "T"
      }),
      new TestTransaction({
        receiver: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
        sender: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
        value: "0",
        gasLimit: 50000,
        gasPrice: 1000000000,
        chainID: "T"
      }),
    ];

    await walletProvider.signTransactions(mockTransactions);
    assert.equal(decodeURI(window.location.href), `http://mocked-wallet.com/hook/sign?nonce[0]=0&nonce[1]=0&value[0]=0&value[1]=0&receiver[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&receiver[1]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[1]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&gasPrice[0]=1000000000&gasPrice[1]=1000000000&gasLimit[0]=50000&gasLimit[1]=50000&data[0]=&data[1]=&chainID[0]=T&chainID[1]=T&version[0]=1&version[1]=1&callbackUrl=${encodeURI("http://return-to-wallet")}`);

    await walletProvider.signTransactions(mockTransactions, {callbackUrl: "http://another-callback"});
    assert.equal(decodeURI(window.location.href), `http://mocked-wallet.com/hook/sign?nonce[0]=0&nonce[1]=0&value[0]=0&value[1]=0&receiver[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&receiver[1]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[0]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&sender[1]=erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu&gasPrice[0]=1000000000&gasPrice[1]=1000000000&gasLimit[0]=50000&gasLimit[1]=50000&data[0]=&data[1]=&chainID[0]=T&chainID[1]=T&version[0]=1&version[1]=1&callbackUrl=${encodeURI("http://another-callback")}`);
  });
});

class TestTransaction implements ITransaction {
  nonce: number = 0;
  value: string = "";
  receiver: string = "";
  gasPrice: number = 0;
  gasLimit: number = 0;
  data: string = "";
  chainID: string = "";
  version: number = 1;
  options: number = 0;

  sender: string = "";
  signature: string = "";

  constructor(init?: Partial<TestTransaction>) {
      Object.assign(this, init);
  }

  toPlainObject(): any {
    return {
        nonce: this.nonce,
        value: this.value,
        receiver: this.receiver,
        sender: this.sender,
        gasPrice: this.gasPrice,
        gasLimit: this.gasLimit,
        data: Buffer.from(this.data).toString("base64"),
        chainID: this.chainID,
        version: this.version,
        options: this.options ? this.options : undefined
    };
  }
}
