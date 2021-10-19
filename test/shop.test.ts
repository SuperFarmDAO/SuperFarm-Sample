import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber } from 'bignumber.js';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import * as mocha from 'mocha-steps';
import { toUtf8Bytes } from '@ethersproject/strings';

BigNumber.config({ EXPONENTIAL_AT: 60 }); // dont shorten strings with bignumbers unless length > 60

// Test the Shop
describe('Shop test', async () => {
  let shop: Contract;
  let item: Contract;
  let asset: Contract;

  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let minter: SignerWithAddress;
  let purchaser: SignerWithAddress;
  
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  let PricePairs: any;
  
  // Assets used for the test
  const Assets = {
    purchaser: '10000000',
    owner: '10000000',
  };
  
  const Items = {
    Karambit: {
      id: 0,
      amount: 2,
      data: toUtf8Bytes('Crimson Web'),
    },
    M4A4: {
      id: 1,
      amount: 10,
      data: toUtf8Bytes('Howl'),
    },
    AWP: {
      id: 2,
      amount: 4,
      data: toUtf8Bytes('Souvenir Dragon Lore'),
    },
  };
  

  before(async () => {
    [owner, creator, minter, purchaser] = await ethers.getSigners();
  });
  mocha.step('Step 1: Should deploy contracts', async () => {
    // Deploy Item
    const Item = await ethers.getContractFactory('TestERC1155');
    item = await Item.deploy('Item');
    await item.deployed();

    // Deploy Asset
    const Asset = await ethers.getContractFactory('TestERC20');
    asset = await Asset.deploy(
      'Asset Token',
      'AST',
    );
    await asset.deployed();

    const Shop = await ethers.getContractFactory('Shop');
    shop = await Shop.deploy(
      'Shop',
      minter.address,
      '1000',
      '5000',
      creator.address,
    );
    await shop.deployed();

  });

  mocha.step('Step 2: Should mint assets and items', async () => {
    
    await asset.grantRole(ethers.utils.id('MINTER_ROLE'), minter.address);
    await item.grantRole(ethers.utils.id('MINTER_ROLE'), minter.address);

    PricePairs = [
      { assetType: 2, price: ethers.utils.parseEther('200'), asset: asset.address },
      { assetType: 1, price: ethers.utils.parseEther('5'), asset: zeroAddress },
    ];

    await asset.connect(minter).mint(
      purchaser.address,
      ethers.utils.parseEther(Assets.purchaser.toString()),
    );
    await asset.connect(minter).mint(
      owner.address,
      ethers.utils.parseEther(Assets.owner.toString()),
    );
    expect(await asset.totalSupply()).to.be.eq(ethers.utils.parseEther('20000000'));

    await item.connect(minter).mint(creator.address, Items.Karambit.id, Items.Karambit.amount, Items.Karambit.data);
    await item.connect(minter).mint(creator.address, Items.M4A4.id, Items.M4A4.amount, Items.M4A4.data);
    await item.connect(minter).mint(creator.address, Items.AWP.id, Items.AWP.amount, Items.AWP.data);

    // Deliever
    await item.connect(creator).setApprovalForAll(owner.address, true);
    await item.connect(owner).safeBatchTransferFrom(
      creator.address,
      owner.address,
      [Items.Karambit.id, Items.M4A4.id, Items.AWP.id],
      [Items.Karambit.amount, Items.M4A4.amount, Items.AWP.amount],
      0,
    );
    expect(await item.balanceOf(owner.address, Items.Karambit.id)).to.be.eq(ethers.BigNumber.from(Items.Karambit.amount));
    expect(await item.balanceOf(owner.address, Items.M4A4.id)).to.be.eq(ethers.BigNumber.from(Items.M4A4.amount));
    expect(await item.balanceOf(owner.address, Items.AWP.id)).to.be.eq(ethers.BigNumber.from(Items.AWP.amount));
  });

  mocha.step('Step 3: Should list items correctly', async () => {
    await item.setApprovalForAll(shop.address, true);
    // list items for the PricePair
    await shop.listItems(
      PricePairs,
      [item.address],
      [[Items.Karambit.id, Items.M4A4.id, Items.AWP.id]],
      [[Items.Karambit.amount, Items.M4A4.amount, Items.AWP.amount]],
    );
    // check for Karambit
    expect((await shop.inventory(0)).id).to.be.eq(ethers.BigNumber.from(Items.Karambit.id));
    expect((await shop.inventory(0)).amount).to.be.eq(ethers.BigNumber.from(Items.Karambit.amount));
    expect((await shop.inventory(0)).token).to.be.eq(item.address);
    // check for M4A4
    expect((await shop.inventory(1)).id).to.be.eq(ethers.BigNumber.from(Items.M4A4.id));
    expect((await shop.inventory(1)).amount).to.be.eq(ethers.BigNumber.from(Items.M4A4.amount));
    expect((await shop.inventory(1)).token).to.be.eq(ethers.BigNumber.from(item.address));
    // check for AWP
    expect((await shop.inventory(2)).id).to.be.eq(ethers.BigNumber.from(Items.AWP.id));
    expect((await shop.inventory(2)).amount).to.be.eq(ethers.BigNumber.from(Items.AWP.amount));
    expect((await shop.inventory(2)).token).to.be.eq(ethers.BigNumber.from(item.address));

    // list items with bad arguments
    await expect(shop.listItems(
      PricePairs,
      [item.address],
      [[Items.Karambit.id, Items.M4A4.id]],
      [[Items.Karambit.amount, Items.M4A4.amount, Items.AWP.amount]],
    )).to.be.revertedWith('ERC1155: ids and amounts length mismatch');

  });

  mocha.step('Step 4: Should price pairs for items correctly', async () => {
    // check for erc20 asset type
    expect((await shop.prices(0, 0)).price).to.be.eq(PricePairs[0].price);
    expect((await shop.prices(0, 0)).assetType).to.be.eq(PricePairs[0].assetType);
    expect((await shop.prices(0, 0)).asset).to.be.eq(PricePairs[0].asset);
    // check for erc20 asset type
    expect((await shop.prices(0, 1)).price).to.be.eq(PricePairs[1].price);
    expect((await shop.prices(0, 1)).assetType).to.be.eq(PricePairs[1].assetType);
    expect((await shop.prices(0, 1)).asset).to.be.eq(zeroAddress);
    // check for pointer outside prices and inventory
    expect((await shop.inventory(3)).id).to.be.eq(ethers.BigNumber.from(0));
    expect((await shop.inventory(3)).amount).to.be.eq(ethers.BigNumber.from(0));
    expect((await shop.inventory(3)).token).to.be.eq(zeroAddress);
    expect((await shop.prices(3, 0)).price).to.be.eq(ethers.BigNumber.from(0));
    expect((await shop.prices(3, 0)).assetType).to.be.eq(ethers.BigNumber.from(0));
    expect((await shop.prices(3, 0)).asset).to.be.eq(zeroAddress);
  });

  mocha.step('Step 5: Should revert while listing items with wrong arguments lenght', async () => {
    // check for erc20 asset type
    await expect(shop.listItems(
      PricePairs,
      [item.address],
      [[Items.Karambit.id, Items.M4A4.id]],
      [[Items.Karambit.amount, Items.M4A4.amount, Items.AWP.amount]],
    )).to.be.revertedWith('ERC1155: ids and amounts length mismatch');

  });

  mocha.step('Step 6: Should change items prices', async () => {
    // for test
    const newPricePairs = [
      { assetType: 1, price: ethers.utils.parseEther('50'), asset: zeroAddress },
      { assetType: 2, price: ethers.utils.parseEther('500'), asset: asset.address },
    ];
    await shop.changeItemPrice(
      2,
      [newPricePairs[0], newPricePairs[1]],
    );
    // check out new AWP prices
    expect((await shop.prices(2, 0)).price).to.be.eq(newPricePairs[0].price);
    expect((await shop.prices(2, 0)).assetType).to.be.eq(newPricePairs[0].assetType);
    expect((await shop.prices(2, 0)).asset).to.be.eq(zeroAddress);
    expect((await shop.prices(2, 1)).price).to.be.eq(newPricePairs[1].price);
    expect((await shop.prices(2, 1)).assetType).to.be.eq(newPricePairs[1].assetType);
    expect((await shop.prices(2, 1)).asset).to.be.eq(asset.address);
  });

  mocha.step('Step 7: Should remove item', async () => {
    // remove 2 Karambit bars
    await shop.removeItem(0, 2);
    expect((await shop.inventory(0)).amount).to.be.eq(ethers.BigNumber.from(Items.Karambit.amount - 2));
    // remove more Karambit knifes than there are in shop
    await expect(shop.removeItem(0, Items.Karambit.amount)).to.be.revertedWith('There is not enough of your desired item to remove.');
  });

  mocha.step('Step 9: Should revert when a non-owner calls', async function () {
    await expect(shop.connect(purchaser).removeItem(1, 5)
    ).to.be.revertedWith("caller is not the owner");
});
  mocha.step('Step 10: Should purchase an item for ERC20', async () => {
    // purchase entire M4A4 stock for ERC20
    await asset.connect(purchaser).approve(shop.address, ethers.utils.parseEther('100000'));
    await shop.connect(purchaser).purchaseItem(Items.M4A4.id, Items.M4A4.amount, 0);
    expect((await shop.inventory(Items.M4A4.id)).amount).to.be.eq(0);
    // check fees
    expect(await asset.balanceOf(minter.address)).to.be.eq(ethers.utils.parseEther(((200 * 10 * 1) / 100).toString()));
    // try purchase some more M4A4
    await expect(shop.connect(purchaser).purchaseItem(Items.M4A4.id, 1, 0)).to.be.revertedWith('There is not enough of your desired item in stock to purchase.');
    // try purchase 0 M4A4
    await expect(shop.connect(purchaser).purchaseItem(Items.M4A4.id, 0, 0)).to.be.revertedWith('There is not enough of your desired item in stock to purchase.');
  });

  mocha.step('Step 11: Should revert when insufficient amount sent for purchase', async () => {
    // purchase AWP for native currency
    await expect(shop.connect(purchaser).purchaseItem(Items.AWP.id, Items.AWP.amount, 0, 
    { value: ethers.utils.parseEther('199') })).to.be.revertedWith('You did not send enough Ether to complete this purchase'); //4*50, so should be less then 200
  });

  mocha.step('Step 12: Should purchase an item for Ether', async () => {
    // purchase AWP for native currency
    const before = (await creator.getBalance()).toString();
    await shop.connect(purchaser).purchaseItem(Items.AWP.id, Items.AWP.amount, 0, { value: ethers.utils.parseEther('200') });
    const after = (await creator.getBalance()).toString();
    expect((await shop.inventory(2)).amount).to.be.eq(0);
    // check eth fee
    expect(ethers.utils.parseEther((200 * 5 / 100).toString())).to.be.eq(ethers.BigNumber.from(after).sub(ethers.BigNumber.from(before)));
  });

  mocha.step('Step 13: View function should work correctly', async () => {
    // getShopInfo
    const info = await shop.getShopInfo();
    expect(info[0]).to.be.eq(1);
    expect(info[1]).to.be.eq('Shop');
    expect(info[2]).to.be.eq(minter.address);
    expect(info[3].toString()).to.be.eq('1000');
    expect(info[4]).to.be.eq(creator.address);
    expect(info[5].toString()).to.be.eq('5000');
    expect(await shop.getInventoryCount()).to.be.eq(3);
  });
});
