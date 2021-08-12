const hre = require("hardhat");
const dotenv = require('dotenv');
const network = hre.network.name;
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync(".env-" + network))
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}


async function main() { 
    const Shop = await ethers.getContractFactory('Shop');
    const owner = await ethers.getSigner();
    
    console.log("starting deploying shop contract");

    shop = await Shop.deploy(
        String(process.env.SHOP_NAME),
        process.env.FEE_OWNER,
        process.env.FEE_PERCENT,
        process.env.ROYALTY_PERCENT,
        process.env.ROYALTY_OWNER
    );
    console.log("shop contract deployed with address: " + shop.address);
}



main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });