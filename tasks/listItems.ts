import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import fs from 'fs';
import dotenv from 'dotenv';

import type { Shop } from "../src/types/Shop";

//npx hardhat listitem --network rinkeby
task("listItems", "list items on the market")
    .setAction(async (taskArgs: TaskArguments, hre) => {
        const net = await hre.network.name;
        const config = dotenv.parse(fs.readFileSync(`.env${net}`));
        for (const parameter in config) {
            process.env[parameter] = config[parameter]
        }

        const list = {
            pairs: [
                { assetType: 1, price: hre.ethers.utils.parseEther("5"), asset: process.env.PAYMENTTOKEN_ADDRESS as string },
                { assetType: 2, price: hre.ethers.utils.parseEther("15"), asset: hre.ethers.constants.AddressZero }
            ],
            items: [process.env.TOKENFORSALE_ADDRESS as string],
            ids: [[0, 1, 2]],
            amounts: [[1, 10, 20]]
        }

        const Shop: Shop = <Shop>await hre.ethers.getContractAt("Shop", config.MARKET_ADDRESS as string);

        await Shop.listItems(list.pairs, list.items, list.ids, list.amounts);

        console.log("items listed")
    });