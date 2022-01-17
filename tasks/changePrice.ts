import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import fs from 'fs';
import dotenv from 'dotenv';

import type { Shop } from "../src/types/Shop";

//npx hardhat removeItem --itemId {ID} --network rinkeby
task("changePrice", "change price of item at the market")
    .addParam("itemId", "id of the specific inventory item that you want to change price")
    .setAction(async (taskArgs: TaskArguments, hre) => {
        const net = await hre.network.name;
        const config = dotenv.parse(fs.readFileSync(`.env${net}`));
        for (const parameter in config) {
            process.env[parameter] = config[parameter]
        }

        const newPricePairs = [
            { assetType: 1, price: hre.ethers.utils.parseEther("10"), asset: hre.ethers.constants.AddressZero },
            { assetType: 2, price: hre.ethers.utils.parseEther("15"), asset: process.env.ASSET_ADDRESS as string }
        ];
        const Shop: Shop = <Shop>await hre.ethers.getContractAt("Shop", config.MARKET_ADDRESS as string);

        await Shop.changeItemPrice(taskArgs.itemId, newPricePairs);

        console.log("item price changed")
    });