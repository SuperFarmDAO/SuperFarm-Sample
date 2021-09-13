import fs from 'fs';
import {task} from "hardhat/config";
import dotenv from 'dotenv';

task("mintAsset", "List new Items")
    .setAction(async function (args, hre) {
        const network = hre.network.name;
        const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
        for (const parameter in envConfig) {
            process.env[parameter] = envConfig[parameter]
        }
        const to = "0x31a7c42EDBc1eA0196aFa766a46b42B99a903e4e";
        // get asset 
        const asset = await hre.ethers.getContractAt(process.env.ASSET_TOKEN_NAME as string, process.env.ASSET_ADDRESS as string);
        console.log(`Got asset contract at ${asset.address}`);
        //mint
        console.log(`Minting to ${to}...`);
        await asset.mint(to, hre.ethers.utils.parseEther("1000000"))
        console.log("Finished minting asset.");
    })