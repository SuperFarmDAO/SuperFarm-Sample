import fs from 'fs';
import dotenv from 'dotenv';

import type { Shop } from "../src/types/Shop";
import type { Shop__factory } from "../src/types/factories/Shop__factory";
import hre from 'hardhat';

//npx hardhat run scripts/deploy.shop.ts --network rinkeby
async function main() {
    const net = hre.network.name;
    const config = dotenv.parse(fs.readFileSync(`.env${net}`));
    for (const parameter in config) {
        process.env[parameter] = config[parameter]
    }

    const Shop: Shop__factory = <Shop__factory>await hre.ethers.getContractFactory("Shop");
    const market: Shop = <Shop>await Shop.deploy(
        config.SHOP_NAME as string,
        config.FEE_OWNER,
        config.FEE_PERCENT,
        config.ROYALTY_OWNER,
        config.ROYALTY_PERCENT,
    )
    await market.deployed()


    //Sync env file
    fs.appendFileSync(`.env${net}`, `\r\# MARKET deployed at \rMARKET_ADDRESS=${market.address}\r`)

    console.log(`MARKET deployed to: ${market.address}`)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });