const fs = require('fs');
const hre = require("hardhat");
const dotenv = require('dotenv');

const network = hre.network.name;
const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));

for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

async function main() {
  // This is to manually compile incase of Node when the script is run directly
  // await hre.run('compile');
  let owner;

  //Get Owner
  [owner] = await ethers.getSigners();

  //Deploy
  const TestERC1155 =  await ethers.getContractFactory(String(process.env.TESTERC1155));
  const testERC1155 = await TestERC1155.deploy();
  await testERC1155.deployed();

  //Console
  console.log("TestERC1155 deployed to:  ", testERC1155.address);
  console.log("TestERC1155 Deployer:     ", owner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
