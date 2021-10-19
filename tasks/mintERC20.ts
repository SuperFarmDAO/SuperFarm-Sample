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
        let [owner] = await hre.ethers.getSigners();

        const asset = await hre.ethers.getContractAt(process.env.ASSET_CONTRACT_NAME as string, process.env.ASSET_ADDRESS as string);
        console.log(`Got asset contract at ${asset.address}`);

        console.log(`Minting to ${owner.address}...`);
        await asset.mint(owner.address, hre.ethers.utils.parseEther("10000000"))
        console.log("Finished.");
    })