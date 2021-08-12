const { expect } = require("chai");
const hre = require("hardhat");
const dotenv = require('dotenv');
const network = hre.network.name;
const fs = require('fs');
const envConfig = dotenv.parse(fs.readFileSync(".env-" + network))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

beforeEach(async () => {
  [...account] = await ethers.getSigners();
});

describe("Shop main functions test", function () {

  it("Should deploy shop and Tokens contracts", async function () {

    const Shop = await ethers.getContractFactory('Shop');
    const ERC1155 = await ethers.getContractFactory('Token1155');
    const ERC20 = await ethers.getContractFactory('Token20');

    console.log("starting deploying shop contract");

    shop = await Shop.deploy(
      "Nikita's shop",
      account[0].address,
      50000,
      50000,
      account[1].address
    );
    console.log("shop contract deployed with address: " + shop.address);
    console.log("starting deploying erc1155 contract");
    erc1155 = await ERC1155.deploy();
    console.log("erc1155 contract deployed with address: " + erc1155.address);


    console.log("starting deploying erc20 contract");
    erc20 = await ERC20.deploy(
      "ERC20Test",
      "ERC20Test");
    console.log("erc20 contract deployed with address: " + erc20.address);

    let balance = await erc20.balanceOf(account[0].address);
    expect(balance.toString()).to.equal(ethers.utils.parseEther("250000"));

    await erc20.connect(account[0]).transfer(account[1].address, ethers.utils.parseEther("10"));
    balance = await erc20.balanceOf(account[1].address);
    console.log(balance.toString());
    expect(balance.toString()).to.equal(ethers.utils.parseEther("10"));


  });

  it("Shoud list all items", async function () {
    await erc1155.connect(account[0]).setApprovalForAll(shop.address, true);

    let items = [{
      token: erc1155.address,
      asset: erc20.address,
      id: 1,
      amount: 10,
      assetType: 2,
      price: ethers.utils.parseEther("1")
    },
    {
      token: erc1155.address,
      asset: erc20.address,
      id: 2,
      amount: 10,
      assetType: 1,
      price: ethers.utils.parseEther("1")
    },
    ]


    await shop.connect(account[0]).listItems(items);


    let nextItemId = await shop.getInventoryCount();
    expect(nextItemId.toString()).to.equal('2');
    
  });

  it("shoud buy for erc20 token", async function () {
    await erc20.connect(account[1]).approve(shop.address, ethers.utils.parseEther("10"));
    await shop.connect(account[1]).purchaseItem(1, 1);

    let balance = await erc1155.connect(account[1]).balanceOf(account[1].address, 1);

    expect(balance.toString()).to.equal('1');
  });

  it("shoud buy for ether", async function () {
    await shop.connect(account[1]).purchaseItem(2, 2, {value: ethers.utils.parseEther("2")});
    let balance = await erc1155.connect(account[1]).balanceOf(account[1].address, 2);
    expect(balance.toString()).to.equal('2');
  });


  it("Try to remove item", async function () {
    let oldBalance = await erc1155.balanceOf(shop.address, 1);
    await shop.connect(account[0]).removeItem(1, 5);

    let balance = await erc1155.balanceOf(shop.address, 1);
    expect(balance.toString()).to.equal(String(oldBalance.toString() - 5));
    try {
      await shop.connect(account[0]).removeItem(1, 5);
    }
    catch (error) {
      expect(error.message).to.include("subtraction overflow")
    }
  });

  it("Try to change item's price", async function () {
    await shop.connect(account[0]).changeItemPrice([1], [ethers.utils.parseEther("2")]);
  });
});
