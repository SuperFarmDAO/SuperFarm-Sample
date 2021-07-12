import { 
  Contract, 
  ContractFactory 
} from "ethers"
import { ethers } from "hardhat"

const main = async(): Promise<any> => {
  const ExampleERC20: ContractFactory = await ethers.getContractFactory("ExampleERC20")
  const erc20: Contract = await ExampleERC20.deploy()
  await erc20.deployed()
  console.log(`ExampleERC20 deployed to: ${erc20.address}`)

  const GameItem: ContractFactory = await ethers.getContractFactory("GameItem")
  const erc1155: Contract = await GameItem.deploy()
  await erc1155.deployed()
  console.log(`GameItem deployed to: ${erc1155.address}`)

  await erc1155.mint("0xE662f9575634dbbca894B756d1A19A851c824f00", 0, 100, ethers.utils.id('gold'));
  await erc1155.mint("0xE662f9575634dbbca894B756d1A19A851c824f00", 1, 1000, ethers.utils.id('silver'));
  await erc1155.mint("0xE662f9575634dbbca894B756d1A19A851c824f00", 2, 1000000, ethers.utils.id('bronze'));
  await erc1155.mint("0xE662f9575634dbbca894B756d1A19A851c824f00", 3, 10, ethers.utils.id('sword'));

  const Shop: ContractFactory = await ethers.getContractFactory("Shop")

  const shop: Contract = await Shop.deploy(
    "My Shop",
    "0xbebF76d496a855964845706f12A9f75e9Ae6423d",
    1,
    2,
    "0x8C4F01cEEBc4dc0F5e78C789e4180e7fbd3A38Ae"
  )
  await shop.deployed()
  console.log(`Shop deployed to: ${shop.address}`)
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error)
  process.exit(1)
})
