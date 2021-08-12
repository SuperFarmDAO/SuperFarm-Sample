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
  const Shop =  await ethers.getContractFactory(String(process.env.SHOP));
  const shop = await Shop.deploy(
    String(process.env.NAME), 
    owner.address, 
    process.env.FEEPERCENT, 
    process.env.ITEMROYALTYPERCENT, 
    owner.address);

  console.log("Shop deployed to:       ", shop.address);
  console.log("Shop Deployer:          ", owner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
