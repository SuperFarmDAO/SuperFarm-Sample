import fs from 'fs';
import dotenv from 'dotenv';
import hre, { ethers } from 'hardhat';
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
    let shop : Contract;

    [owner] = await ethers.getSigners();
    console.log("Owner address: ", owner.address)
    const balance = await owner.getBalance();
    console.log(`Owner account balance: ${ethers.utils.formatEther(balance).toString()}`)

    const Shop = await ethers.getContractFactory("Shop");
    shop = await Shop.deploy(
        process.env.SHOP_NAME as string,
        process.env.SHOP_FEE_OWNER as string,
        process.env.SHOP_FEE as string,
        process.env.SHOP_ROYALTY_PERCENT as string,
        process.env.SHOP_ROYALTY_FEE_OWNER as string 
    );
   await shop.deployed();
   console.log(`Shop has been deployed at ${shop.address}`);

    //Sync env file
    fs.appendFileSync(`.env-${network}`, 
    `SHOP_ADDRESS=${shop.address}\r`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
