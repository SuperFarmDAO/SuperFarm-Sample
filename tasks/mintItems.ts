import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("mintItems", "List new Items")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }
        const to = "0x31a7c42EDBc1eA0196aFa766a46b42B99a903e4e";
        const Items ={
            gold: {
                id: 0,
                amount: 10,
                data: 0
            },
            silver: {
                id: 1,
                amount: 100,
                data: 0
            },
            cigar: {
                id: 2,
                amount: 1,
                data: hre.ethers.utils.toUtf8Bytes("Macanudos")
            }
        }
        // get asset and item
        const item = await hre.ethers.getContractAt(process.env.ITEM_TOKEN_NAME as string, process.env.ITEM_ADDRESS as string);
        console.log(`Got item contract at ${item.address}`);
        console.log('Minting items...');
        await item.mint(to, Items.gold.id, Items.gold.amount, Items.gold.data)
        await item.mint(to, Items.silver.id, Items.silver.amount, Items.silver.data)    
        await item.mint(to, Items.cigar.id, Items.cigar.amount, Items.cigar.data)
        console.log("Finished minting items.");
    })