import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("purchaseItem", "Purchase an item")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }
        // get shop
        const shop = await hre.ethers.getContractAt(process.env.SHOP_NAME as string, process.env.SHOP_ADDRESS as string);
        console.log(`Got shop at ${shop.address}...`);
        console.log('Purchasing item...');
        await shop.purchaseItem(2, 1, 0, {value: hre.ethers.utils.parseEther("0.01")})
        console.log("Purchased an item.");
    })