import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import fs from 'fs';
import dotenv from 'dotenv';

import type { Shop } from "../src/types/Shop";

//npx hardhat removeItem --itemId {ID} --amount 1 --network rinkeby
task("removeItem", "remove item from the market")
    .addParam("itemId", "id of the specific inventory item that you want to remove")
    .addParam("amount", "amount of item that you want to remove")
    .setAction(async (taskArgs: TaskArguments, hre) => {
        const net = await hre.network.name;
        const config = dotenv.parse(fs.readFileSync(`.env${net}`));
        for (const parameter in config) {
            process.env[parameter] = config[parameter]
        }

        const Shop: Shop = <Shop>await hre.ethers.getContractAt("Shop", config.MARKET_ADDRESS as string);

        await Shop.removeItem(taskArgs.itemId, taskArgs.amount);

        console.log("item removed")
    });