### Setup

Ensure you have appropriate versions of node and yarn installed, then:

```zsh
yarn install
```

#### Testing

```zsh
yarn test
```

## Prepare to Deploy

Edit the deployment script in `scripts/deploy.ts`.
Add your private key(s) as an array to your environment of choice's accounts field in hardhat.config.js.

## Deploy

You can chose which environment you want to deploy to by passing in the `--network` flag with `ropsten`, `avash`, `fuji`, or `avalanche_mainnet`, For example:

```zsh
yarn deploy --network avalanche_mainnet
```

## Running / Testing

To run/test this locally, first, run the frontend.

### Running the frontend
```zsh
cd vite-project
yarn
yarn dev
```

The frontend was developed using contracts deployed to Avalanche's fuji testnet.
Ensure you've added the fuji testnet to your MetaMask.

### Fuji RPC config
Network Name: Avalanche FUJI C-Chain
New RPC URL: https://api.avax-test.network/ext/bc/C/rpc
ChainID: 43113
Symbol: AVAX
Explorer: https://cchain.explorer.avax-test.network

###

Ropsten verified contract
https://ropsten.etherscan.io/address/0x5ee2c554abf271416509a5b86e4528d09949fdd4#readContract

