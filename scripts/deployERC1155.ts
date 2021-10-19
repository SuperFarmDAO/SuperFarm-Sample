import fs from 'fs';
import dotenv from 'dotenv';
import hre, {ethers} from 'hardhat';
import {Contract,  ContractFactory} from "ethers";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const network = hre.network.name;
const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));

for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

async function main() {
  // This is to manually compile incase of Node when the script is run directly
  // await hre.run('compile');
  let owner: SignerWithAddress;
  let TestERC1155 : ContractFactory;
  let testERC1155: Contract;

  [owner] = await ethers.getSigners();
  console.log("Deployer:", owner.address);

  TestERC1155 =  await ethers.getContractFactory(process.env.ITEM_CONTRACT_NAME as string);
  testERC1155 = await TestERC1155.deploy(process.env.ITEM_TOKEN_URI as string);
  await testERC1155.deployed();

  console.log("TestERC1155 deployed to:", testERC1155.address);
  
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });