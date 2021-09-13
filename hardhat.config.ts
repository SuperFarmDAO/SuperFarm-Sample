import { config as dotenvConfig } from 'dotenv';
import { NetworkUserConfig } from 'hardhat/types';
import 'hardhat-docgen'
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import "@nomiclabs/hardhat-etherscan";
import 'solidity-coverage';
import "./tasks";

// inject parameters
dotenvConfig();

// Ensure everything is in place
let mnemonic: string;
if (!process.env.MNEMONIC) {
  throw new Error('Please set your MNEMONIC in a .env file')
} else {
  mnemonic = process.env.MNEMONIC;
}
let infuraApiKey: string;
if (!process.env.INFURA_API_KEY) {
  throw new Error('Please set your INFURA_API_KEY in a .env file')
} else {
  infuraApiKey = process.env.INFURA_API_KEY;
}

//define chainIds for networks 
const chainIds = {
    mainnet: 1,
    rinkeby: 4,
    kovan: 42
} 

// create network obj
function createNetworkConfig(
    network: keyof typeof chainIds,
  ): NetworkUserConfig {
    const url: string = `https://${network}.infura.io/v3/${infuraApiKey}`;
    return {
      accounts: {
        count: 10,
        initialIndex: 0,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
      chainId: chainIds[network],
      gas: "auto",
      gasPrice: 30_000_000_000, // gwei
      url,
    };
  }

export default {
    solidity: {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      defaultNetwork: 'hardhat',
      networks: {
        mainnet: createNetworkConfig('mainnet'),
        rinkeby: createNetworkConfig('rinkeby'),
        kovan: createNetworkConfig('kovan')
      },
      etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: process.env.ETHERSCAN_API_KEY
      },
      paths: {
        artifacts: './artifacts',
        cache: './cache',
        sources: './contracts',
        tests: './test'
      },
      mocha: {
        timeout: 20000
      },
      docgen: {
        path: './docs',
        runOnCompile: true
      }
};