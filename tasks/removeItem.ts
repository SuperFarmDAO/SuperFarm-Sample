import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("removeItem", "Removes an item from the shop")
    .addParam("itemID", "The item ID")
    .addParam("amount", "Item amount")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }

        const shop = await hre.ethers.getContractAt(process.env.SHOP_CONTRACT_NAME as string, process.env.SHOP_ADDRESS as string);
        console.log('Shop address:', shop.address);
        //remove item
        console.log('Removing item...');
        await shop.removeItem(args.itemID , args.amount);
        console.log("Finished removing item.");
    })