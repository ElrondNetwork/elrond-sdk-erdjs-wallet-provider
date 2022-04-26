# Elrond SDK for JavaScript: Elrond (Web) Wallet provider

Signing provider for dApps: Elrond (Web) Wallet.

An integration sample can be found [here](examples/app.js). However, for all purposes, **we recommend using [dapp-core](https://github.com/ElrondNetwork/dapp-core)** instead of integrating the signing provider on your own.

## Distribution

[npm](https://www.npmjs.com/package/@elrondnetwork/erdjs-web-wallet-provider)

## Installation

```
npm install @elrondnetwork/erdjs-web-wallet-provider
```

### Building the library

In order to compile the library, run the following:

```
npm install
npm run compile
```

### Running the examples

Make sure you have the package `http-server` installed globally.

```
npm install --global http-server
```

When you are ready, build the examples:

```
npm run compile-examples
```

Start the server and navigate to `http://localhost:8080/examples/index.html`

```
http-server --port=8080
```
