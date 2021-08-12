require("@nomiclabs/hardhat-web3");



task("listItems", "Creating locks for Private Tokensale")
    .setAction(async (args, hre, runSuper) => {

        const network = hre.network.name;
        const fs = require('fs');
        const dotenv = require('dotenv');
        const envConfig = dotenv.parse(fs.readFileSync(".env-" + network))
        for (const k in envConfig) {
            process.env[k] = envConfig[k]
        }

        let items = [{
            token: process.env.TOKEN20_ADDRESS,
            asset: process.env.TOKEN1155_ADDRESS,
            id: 1,
            amount: 10,
            assetType: 2,
            price: ethers.utils.parseEther("1")
          },
          {
            token: process.env.TOKEN20_ADDRESS,
            asset: process.env.TOKEN1155_ADDRESS,
            id: 2,
            amount: 10,
            assetType: 1,
            price: ethers.utils.parseEther("1")
          },
          ]
        

        const shop = await hre.ethers.getContractAt("Shop", process.env.SHOP_ADDRESS);
        const token1155 = await hre.ethers.getContractAt("Token1155", process.env.TOKEN1155_ADDRESS);
        console.log("shop address:", shop.address);


        console.log("approving");
        await token1155.setApprovalForAll(shop.address, true);
        console.log("approved");

        console.log("Starting adding items");
        await shop.listItems(items);
        console.log("finished adding items");

    });