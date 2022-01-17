import fs from 'fs';
import dotenv from 'dotenv';
import hre from 'hardhat';

//npx hardhat run scripts/verify.shop.ts --network rinkeby
async function main() {
    const net = hre.network.name;
    const config = dotenv.parse(fs.readFileSync(`.env${net}`));
    for (const parameter in config) {
        process.env[parameter] = config[parameter]
    }


    console.log('starting verify Shop')
    try {
        await hre.run('verify:verify', {
            address: config.MARKET_ADDRESS as string,
            contract: "contracts/Shop.sol:Shop",
            constructorArguments: [
                config.SHOP_NAME as string,
                config.FEE_OWNER,
                config.FEE_PERCENT,
                config.ROYALTY_OWNER,
                config.ROYALTY_PERCENT,
            ],
        });
        console.log('verify success')
    } catch (e: any) {
        console.log(e.message);
    }
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });