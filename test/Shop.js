const { hre } = require("hardhat");
const { expect } = require("chai");
const { mocha, test } = require("mocha");
const { ethers } = require("hardhat");
const { artifacts } = require("hardhat");
 
//Test the Shop contract's functionality
describe('Shop', function(){
	let shopInstance, testERC20Instance, testERC1155Instance;
	let accounts, deployer, feeOwner, royaltyOwner, lister;
	let feePercent, itemRoyaltyPercent;
	let comparator; //A reusable variable for testing

	//Deploy and Initialize contracts
	before(async function(){
		accounts = await ethers.getSigners();
		deployer = accounts[0]; //Shop Owner
		feeOwner = accounts[0]; //Shop Owner
		royaltyOwner = accounts[1]; //Third Party
		lister = accounts[3];
		buyer = accounts[4];
		feePercent = 200;
		itemRoyaltyPercent = 300;

		ShopInstance = await ethers.getContractFactory("Shop");
		shopInstance = await ShopInstance.connect(deployer).deploy("Shop", feeOwner.address, feePercent, itemRoyaltyPercent, royaltyOwner.address);

		TestERC20Instance = await ethers.getContractFactory("TestERC20");
		testERC20Instance = await TestERC20Instance.connect(deployer).deploy();

		TestERC1155Instance = await ethers.getContractFactory("TestERC1155");
		testERC1155Instance = await TestERC1155Instance.connect(deployer).deploy();
		
	})

	//Check if the variables are initialized correctly
	it('initializs the contract with correct values', async function(){
		comparator = await shopInstance.name();
		expect(comparator.toString()).to.equal("Shop");

		comparator = await shopInstance.feeOwner();
		expect(comparator.toString()).to.equal(feeOwner.address); 

		comparator = await shopInstance.feePercent();
		expect(comparator.toString()).to.equal("200");

		comparator = await shopInstance.itemRoyaltyPercent();
		expect(comparator.toString()).to.equal("300");

		comparator = await shopInstance.royaltyOwner();
		expect(comparator.toString()).to.equal(royaltyOwner.address);
	});

	//Check if inventory count is correct
	it('gets inventory count', async function(){
		comparator = await shopInstance.connect(deployer).getInventoryCount();
		expect(comparator.toString()).to.equal("0");
	});

	//Check if new items get listed correctly
	it('lists new item to the shop which accepts ERC20 token', async function(){
		//Mint new tokens with amount=5 and id=0 to lister that accept ERC20
		await testERC1155Instance.connect(deployer).mint(lister.address, 0, 5, 0);
		//Mint new tokens with amount=5 and id=1 to lister that accept Ether
		await testERC1155Instance.connect(deployer).mint(lister.address, 1, 5, 0);

		await testERC1155Instance.connect(lister).setApprovalForAll(deployer.address, true);

		comparator = await testERC1155Instance.connect(lister).isApprovedForAll(lister.address, deployer.address);
		expect(comparator.toString()).to.equal("true");
		
		//Deployer gets lister tokens to be listed, amount=4 from each ID
		await testERC1155Instance.connect(deployer).safeTransferFrom(lister.address, deployer.address, 0, 4, 0);
		await testERC1155Instance.connect(deployer).safeTransferFrom(lister.address, deployer.address, 1, 4, 0);

		comparator = await testERC1155Instance.connect(deployer).balanceOf(deployer.address, 0);
		expect(comparator.toString()).to.equal("4");

		comparator = await testERC1155Instance.connect(deployer).balanceOf(deployer.address, 1);
		expect(comparator.toString()).to.equal("4");

		//Shop has now access to the tokens with deployer
		await testERC1155Instance.connect(deployer).setApprovalForAll(shopInstance.address, true);

		//Deployer lists the items in the shop which accept ERC20 tokens
		await shopInstance.connect(deployer).listItems(
			[{assetType: 2, price: "5000000000000000000", asset: testERC20Instance.address}], 
			[testERC1155Instance.address],
			[[0]],
			[[4]]);

		//Deployer lists the items in the shop which accept Ether
		await shopInstance.connect(deployer).listItems(
			[{assetType: 1, price: "1000000000000000000", asset: testERC20Instance.address}], 
			[testERC1155Instance.address],
			[[1]],
			[[4]]);
		
		//Items are listed
		comparator = await shopInstance.inventory(0);
		comparator = comparator.id;
		expect(comparator.toString()).to.equal("0");

		comparator = await shopInstance.inventory(1);
		comparator = comparator.id;
		expect(comparator.toString()).to.equal("1");

		//Amounts
		comparator = await shopInstance.inventory(0);
		comparator = comparator.amount;
		expect(comparator.toString()).to.equal("4");

		comparator = await shopInstance.inventory(1);
		comparator = comparator.amount;
		expect(comparator.toString()).to.equal("4");

		//The price pair
		comparator = await shopInstance.prices(0, 0);
		comparator = await comparator.price;
		expect(comparator.toString()).to.equal("5000000000000000000");

		comparator = await shopInstance.prices(1, 0);
		comparator = await comparator.price;
		expect(comparator.toString()).to.equal("1000000000000000000");

		//Next item's token interface pointer inside struct must be 0x00
		//Next is the Index=2. 
		//Index=0 has Item which accepts ERC20.
		//Index=1 has Item which accepts Ether.
		comparator = await shopInstance.inventory(2);
		comparator = comparator.token;
		expect(comparator.toString()).to.equal("0x0000000000000000000000000000000000000000");

	});

	//Check if an item gets removed succesfully
	it('removes an item from the shop', async function(){
		//Remove 1 amount of item id=0 and id=1 each. Remaining=3
		await shopInstance.connect(deployer).removeItem(0, 1);
		await shopInstance.connect(deployer).removeItem(1, 1);

		//3 amounts are still listed in each item
		comparator = await shopInstance.inventory(0);
		comparator = comparator.amount;
		expect(comparator.toString()).to.equal("3");
		
		comparator = await shopInstance.inventory(1);
		comparator = comparator.amount;
		expect(comparator.toString()).to.equal("3");

		//1 amount is with deployer
		comparator = await testERC1155Instance.connect(deployer).balanceOf(deployer.address, 0);
		expect(comparator.toString()).to.equal("1");

		comparator = await testERC1155Instance.connect(deployer).balanceOf(deployer.address, 1);
		expect(comparator.toString()).to.equal("1");

	});

	//Check if an item's price gets changed successfully
	it('changes an item price in the shop', async function(){
		//Now both items in inventory cost same. One with ERC20 and one with Ether
		await shopInstance.connect(deployer).changeItemPrice(0, [{assetType: 2, price: "2000000000000000000", asset: testERC20Instance.address}]);
		await shopInstance.connect(deployer).changeItemPrice(1, [{assetType: 1, price: "2000000000000000000", asset: testERC20Instance.address}]);

		//The price change check
		comparator = await shopInstance.prices(0, 0);
		comparator = await comparator.price;
		expect(comparator.toString()).to.equal("2000000000000000000");

		comparator = await shopInstance.prices(1, 0);
		comparator = await comparator.price;
		expect(comparator.toString()).to.equal("2000000000000000000");

	});

	//Check if an item is being bought successfully
	it('purchases an item from the shop', async function(){
		//===Buying Using ERC20

		//Giving buyer an amount of ERC20 tokens to buy the shopItems
		await testERC20Instance.connect(deployer).transfer(buyer.address, "1000000000000000000000");
		comparator = await testERC20Instance.connect(deployer).balanceOf(buyer.address);
		expect(comparator.toString()).to.equal("1000000000000000000000");

		//Buyer needs to approve the shop contract
		await testERC20Instance.connect(buyer).approve(shopInstance.address, "1000000000000000000000");
		await shopInstance.connect(buyer).purchaseItem(0, 1, 0);

		//Shop has amount=2 with ID=0 now
		comparator = await shopInstance.inventory(0);
		comparator = comparator.amount;
		expect(comparator.toString()).to.equal("2");

		//Buyer has amount=1 now
		comparator = await testERC1155Instance.connect(buyer).balanceOf(buyer.address, 0);
		expect(comparator.toString()).to.equal("1");

		//===Buy Item using Ether
		await shopInstance.connect(buyer).purchaseItem(1, 1, 0, {
			value: ethers.utils.parseEther("5.0"),

		});

		//Shop has amount=2 with ID=1 now
		comparator = await shopInstance.inventory(1);
		comparator = comparator.amount;
		expect(comparator.toString()).to.equal("2");

		//Buyer has amount=1 now
		comparator = await testERC1155Instance.connect(buyer).balanceOf(buyer.address, 1);
		expect(comparator.toString()).to.equal("1");
	});

	//Check again if inventory count is correct
	it('gets inventory count before finishing tests', async function(){
		comparator = await shopInstance.connect(deployer).getInventoryCount();
		expect(comparator.toString()).to.equal("2");
	});

});