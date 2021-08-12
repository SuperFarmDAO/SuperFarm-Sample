const hre = require("hardhat");
const dotenv = require('dotenv');
const network = hre.network.name;
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync(".env-" + network))
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}


async function main() { 
    const ERC20 = await ethers.getContractFactory('Token20');

    console.log("starting deploying erc20 contract");
    erc20 = await ERC20.deploy(
      String(process.env.ERC20_NAME),
      String(process.env.ERC20_SYMBOL));
    console.log("erc20 contract deployed with address: " + erc20.address);
}



main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });