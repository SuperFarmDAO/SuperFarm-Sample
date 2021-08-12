const hre = require("hardhat");
const dotenv = require('dotenv');
const network = hre.network.name;
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync(".env-" + network))
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}


async function main() { 
    const Token = await ethers.getContractFactory('Token1155');
    
    console.log("starting deploying token contract");

    tkn = await Token.deploy();
    console.log("token contract deployed with address: " + tkn.address);
}



main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });