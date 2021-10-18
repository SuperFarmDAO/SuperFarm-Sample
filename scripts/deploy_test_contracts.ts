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
    let shopToken : Contract;
    let shopItems: Contract;

    [owner] = await ethers.getSigners();
    console.log("Owner address: ", owner.address)
    const balance = await owner.getBalance();
    console.log(`Owner account balance: ${ethers.utils.formatEther(balance).toString()}`)

    //Deploy test tokens
    const SHOPTOKEN = await ethers.getContractFactory("ShopToken");
    shopToken = await SHOPTOKEN.deploy();
    await shopToken.deployed()
    console.log(`ShopToken deployed to ${shopToken.address}`)

    const SHOPITEMS = await ethers.getContractFactory("ShopItems");
    shopItems = await SHOPITEMS.deploy(
        process.env.ITEM_TOKEN_URI as string
    );
    await shopItems.deployed()
    console.log(`ShopItems deployed to ${shopItems.address}`)

    //Sync env file
    fs.appendFileSync(`.env-${network}`, 
    `\r\# Deployed at \rSHOP_TOKEN_ADDRESS=${shopToken.address}\rSHOP_ITEMS_ADDRESS=${shopItems.address}\r`)
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });