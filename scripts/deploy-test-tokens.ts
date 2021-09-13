import fs from 'fs';
import dotenv from 'dotenv';
import hre, {ethers} from 'hardhat';
import {Contract} from "ethers";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// gather deployment info
const network = hre.network.name;
const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
for (const parameter in envConfig) {
    process.env[parameter] = envConfig[parameter]
}

async function main() {
    let owner: SignerWithAddress;
    let asset : Contract;
    let item: Contract;

    [owner] = await ethers.getSigners();
    console.log("Owner address: ", owner.address)
    const balance = await owner.getBalance();
    console.log(`Owner account balance: ${ethers.utils.formatEther(balance).toString()}`)

    //Deploy test tokens
    const ASSET = await ethers.getContractFactory(process.env.ASSET_TOKEN_NAME as string);
    asset = await ASSET.deploy(
        process.env.ASSET_TOKEN_NAME,
        process.env.ASSET_TOKEN_SYMBOL,
    );
    await asset.deployed()
    console.log(`Asset Token deployed to ${asset.address}`)

    const ITEM = await ethers.getContractFactory(process.env.ITEM_TOKEN_NAME as string);
    item = await ITEM.deploy(
        process.env.ITEM_TOKEN_URI as string
    );
    await item.deployed()

    //Sync env file
    fs.appendFileSync(`.env-${network}`, 
    `\r\# Deployed at \rASSET_ADDRESS=${asset.address}\rITEM_ADDRESS=${item.address}\r`)
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });