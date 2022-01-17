import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import fs from 'fs';
import dotenv from 'dotenv';

import type { Shop } from "../src/types/Shop";

//npx hardhat purchaseItem --itemId {ID} --amount 1 --assetId 0 --ether(optional) 0.1 --network rinkeby
task("purchaseItem", "purchase item from the market")
    .addParam("itemId", "id of the specific inventory item that you want to remove")
    .addParam("amount", "amount of token that you want to purchase")
    .addParam("assetId", "the index of the asset from the item's asset-price pairs to attempt this purchase using")
    .addOptionalParam("ether", "ether that you sent as payment")
    .setAction(async (taskArgs: TaskArguments, hre) => {
        const net = await hre.network.name;
        const config = dotenv.parse(fs.readFileSync(`.env${net}`));
        for (const parameter in config) {
            process.env[parameter] = config[parameter]
        }

        const Shop: Shop = <Shop>await hre.ethers.getContractAt("Shop", config.MARKET_ADDRESS as string);

        let etherForSend = ""
        if (taskArgs.ether != "")
            etherForSend = taskArgs.ether

        await Shop.purchaseItem(taskArgs.itemId, taskArgs.amount, taskArgs.assetId, { value: hre.ethers.utils.parseEther(etherForSend as string) })

        console.log("item purchased")
    });