import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("changePrice", "Change price")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }
        // get shop
        const shop = await hre.ethers.getContractAt(process.env.SHOP_NAME as string, process.env.SHOP_ADDRESS as string);
        console.log(`Got shop at ${shop.address}...`);
        const zeroAddress = "0x0000000000000000000000000000000000000000",
            newPricePairs = [
                {assetType: 1, price: hre.ethers.utils.parseEther("0.01"), asset: zeroAddress},
                {assetType: 2, price: hre.ethers.utils.parseEther("500"), asset: process.env.ASSET_ADDRESS as string} 
            ];
        // change item price
        console.log('Chaning item price...');
        await shop.changeItemPrice(
            2,
            [newPricePairs[0], newPricePairs[1]]
        )
        console.log("Finished changing price.");
        
    })