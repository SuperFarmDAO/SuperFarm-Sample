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

  let owner: SignerWithAddress;
  let TestERC20 : ContractFactory;
  let testERC20: Contract;

  [owner] = await ethers.getSigners();
  console.log("Deployer:", owner.address);

  TestERC20 =  await ethers.getContractFactory(process.env.ASSET_CONTRACT_NAME as string);
  testERC20 = await TestERC20.deploy(process.env.ASSET_TOKEN_NAME as string,
                                     process.env.ASSET_TOKEN_SYMBOL as string);
  await testERC20.deployed();

  console.log("TestERC20 deployed to:", testERC20.address);
  
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });