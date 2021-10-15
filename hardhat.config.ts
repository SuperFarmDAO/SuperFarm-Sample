import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-docgen"

dotenv.config();

const chainIds = {
  mainnet: 1,
  rinkeby: 4,
  hardhat: 31337
};

let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error('Please set your MNEMONIC in a .env file');
} else {
  mnemonic = process.env.MNEMONIC;
}

let infuraApiKey: string;
if (!process.env.INFURA_API_KEY) {
  throw new Error('Please set your INFURA_API_KEY in a .env file');
} else {
  infuraApiKey = process.env.INFURA_API_KEY;
}

function createNetworkConfig(
  network: keyof typeof chainIds )  {
  const url = `https://${network}.infura.io/v3/${infuraApiKey}`;
  return {
    accounts: { mnemonic: mnemonic },
    chainId: chainIds[network],
    gas: "auto",
    gasPrice: 80000000000,
    url: url
  };
}

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    mainnet: createNetworkConfig('mainnet'),
    rinkeby: createNetworkConfig('rinkeby'),
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 20000
  },
  docgen: {
    path: './doc',
    clear: true,
    runOnCompile: true,
  }
}