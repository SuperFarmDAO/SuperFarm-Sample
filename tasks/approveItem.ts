import fs from 'fs';
import { task } from 'hardhat/config';
import dotenv from 'dotenv';

task('approveItem', 'Approve Item to the shop')
  .setAction(async (args, hre) => {
    const network = hre.network.name;
    const envConfig = dotenv.parse(fs.readFileSync(`.env-${network}`));
    for (const parameter in envConfig) {
      process.env[parameter] = envConfig[parameter];
    }

    const item = await hre.ethers.getContractAt(process.env.ITEM_CONTRACT_NAME as string, process.env.ITEM_ADDRESS as string);
    console.log('Item address:', item.address);

    console.log('Approving ...');
    await item.setApprovalForAll(process.env.SHOP_ADDRESS, true);
    console.log('Done.');
  });
