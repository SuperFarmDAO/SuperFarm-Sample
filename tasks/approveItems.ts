import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("approveItems", "Approve Items")
    .setAction(async function (args, hre) {
        setTimeout(() => {}, 10000);
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }

        // get item
        const item = await hre.ethers.getContractAt(process.env.ITEM_TOKEN_NAME as string, process.env.ITEM_ADDRESS as string);
        console.log(`Got item contract at ${item.address}`);
        //approve
        console.log('Approving items to shop...');
        await item.setApprovalForAll(process.env.SHOP_ADDRESS, true);
        console.log("Finished approving items.");
    })