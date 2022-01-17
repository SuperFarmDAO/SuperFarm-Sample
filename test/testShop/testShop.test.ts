import { artifacts, ethers, waffle } from "hardhat";
import hre from "hardhat";
import dotenv from 'dotenv';
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import fs from 'fs';
import type { TKN } from "../../src/types/TKN";
import type { TRADETOKEN } from "../../src/types/TRADETOKEN";
import type { Shop } from "../../src/types/Shop";
import { Signers } from "../types";

import { shouldDeployCorrectly } from "./testShop.deployment";
import { shouldBehaveCorrectly } from "./testShop.behavior";

describe("Unit tests", function () {
    // gather deployment info
    const network = hre.network.name;
    const config = dotenv.parse(fs.readFileSync(`.env${network}`));
    for (const parameter in config) {
        process.env[parameter] = config[parameter]
    }
    before(async function () {
        this.signers = {} as Signers;
        this.hre = hre;
        const signers: SignerWithAddress[] = await ethers.getSigners();
        this.signers.admin = signers[0];
        this.alice = signers[1];
        this.bob = signers[2];
        this.carl = signers[3];
        this.dan = signers[4];
        this.backend = signers[5];

        const paymentToken = await hre.ethers.getContractFactory("TKN");
        this.paymentToken = <TKN>await paymentToken.deploy(
            config.TOKEN_NAME as string,
            config.TOKEN_SYMBOL as string,
        );
        console.log(`Deployed to: ${this.paymentToken.address}`)

        const tradeToken = await hre.ethers.getContractFactory("TRADETOKEN");
        this.tradeToken = <TRADETOKEN>await tradeToken.deploy("");
        console.log(`Deployed to: ${this.tradeToken.address}`)


        const market = await hre.ethers.getContractFactory("Shop");
        this.instance = <Shop>await market.deploy(
            config.SHOP_NAME as string,
            this.carl.address,
            config.FEE_PERCENT,
            this.dan.address,
            config.ROYALTY_PERCENT,
        );
        console.log(`Deployed to: ${this.instance.address}`)
    });

    describe("Test Shop", function () {
        beforeEach(async function () {
        });

        shouldDeployCorrectly();

        shouldBehaveCorrectly();
    });
});