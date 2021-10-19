import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("chageItemPrice", "Changes the price of specified item")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }
        // get shop
        const shop = await hre.ethers.getContractAt(process.env.SHOP_CONTRACT_NAME as string, process.env.SHOP_ADDRESS as string);
        console.log('Shop:', shop.address);
        const zeroAddress = "0x0000000000000000000000000000000000000000",
            newPricePairs = [
                {assetType: 1, price: hre.ethers.utils.parseEther("0.2"), asset: zeroAddress},
                {assetType: 2, price: hre.ethers.utils.parseEther("50"), asset: process.env.ASSET_ADDRESS as string} 
            ];
        // change item price
        console.log('Chaning item price...');
        await shop.changeItemPrice(
            2,
            [newPricePairs[0], newPricePairs[1]]
        )
        console.log("Finished changing price.");
        
    })