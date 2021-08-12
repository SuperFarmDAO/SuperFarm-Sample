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
  const TestERC20 =  await ethers.getContractFactory(String(process.env.TESTERC20));
  const testERC20 = await TestERC20.deploy();
  await testERC20.deployed();

  //Console
  console.log("TestERC20 deployed to:  ", testERC20.address);
  console.log("TestERC20 Deployer:     ", owner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
