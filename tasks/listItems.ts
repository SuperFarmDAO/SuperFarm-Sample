import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("listItems", "List new Items")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }

        const zeroAddress = "0x0000000000000000000000000000000000000000";
        const list = {
            pairs: [
                {assetType: 2, price: hre.ethers.utils.parseEther("100"), asset: process.env.ASSET_ADDRESS as string},
                {assetType: 1, price: hre.ethers.utils.parseEther("10"), asset: zeroAddress}
            ],
            items: [process.env.ITEM_ADDRESS as string],
            ids: [[0, 1, 2]],
            amounts: [[10, 100, 1]]
        }
        // get shop
        const shop = await hre.ethers.getContractAt(process.env.SHOP_NAME as string, process.env.SHOP_ADDRESS as string);
        console.log(`Got shop contract at ${shop.address}`); 
        // list
        console.log('Listing new items to shop...');
        await shop.listItems(
            list.pairs,
            list.items,
            list.ids,
            list.amounts
        )
        console.log("Finished listing items.");
    })