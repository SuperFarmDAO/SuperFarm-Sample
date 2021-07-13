<template>
  <button type="button" @click="connectWallet()">{{connectButtonText()}}</button>

  <div v-if="state.connected">
    <h1 v-if="state.isShopOwner">Shop Owner</h1>
    <h1 v-else>Shop</h1>
  </div>
  <div v-if="state.connected">
    <h3>Listings ({{state.inventoryCount}})</h3>

    <div  style="display: flex; justify-content: space-between; max-width: 60%; margin: 0 auto;">
      <span v-for='int in state.inventoryCount' :key="int" style="display: inline-block">
        <div v-if="state[`item${int - 1}`]">
          <img v-if="itemObject(state[`item${int - 1}`]).id == 0" src="./../assets/gold.jpg" width="50" height="50" />
          <img v-if="itemObject(state[`item${int - 1}`]).id == 1" src="./../assets/silver.jpg" width="50" height="50" />
          <img v-if="itemObject(state[`item${int - 1}`]).id == 2" src="./../assets/bronze.jpg" width="50" height="50" />
          <div>
            {{itemObject(state[`item${int - 1}`]).amount}}
          </div>
          <button v-if="state.isShopOwner && itemObject(state[`item${int - 1}`]).amount > 0" @click="removeListing(int - 1, itemObject(state[`item${int - 1}`]).amount)">Remove</button>
          <div v-if="!state.isShopOwner">
            <button v-if="!state[`itemPrices${int - 1}`]" @click="getPrices(int - 1, 0)">See Prices</button>
            <div v-if="state[`itemPrices${int - 1}`]">
              <div v-for="pricePair in state[`itemPrices${int - 1}`]" :key="pricePair">
                <button @click="buyItem(int - 1, itemObject(state[`item${int - 1}`]).amount, state[`itemPrices${int - 1}`].indexOf(pricePair), pricePair.assetType, displayPricePair(pricePair).price)">
                  Buy for {{ ethers.utils.formatEther(displayPricePair(pricePair).price.mul(BigNumber.from(itemObject(state[`item${int - 1}`]).amount)).toString()) }} {{displayPricePair(pricePair).name}}
                </button>
              </div>
            </div>
          </div>
        </div>
      </span>
    </div>
  </div>
  <div v-if="state.connected" style="margin: 100px 0 100px 0">
    <h3>Assets</h3>

        <ul v-if="state.isShopOwner">
          <li v-for="pricePair in state.newAssetPricePairs" :key="pricePair.address">
            {{ pricePair.price }} {{ pricePair.assetType == 1 ? 'ETH' : 'XMPL' }}
            <span @click="state.newAssetPricePairs = state.newAssetPricePairs.filter(pair => pair != pricePair)">❌</span>
          </li>
        </ul>

        <div v-if="state.isShopOwner">
          <input v-model="state.newAssetPrice" type="number" min="1">
          <select v-model="state.newAssetAssetType" name="currencies">
            <option value="1">ETH</option>
            <option value="2">XMPL</option>
          </select>

          <button @click="addPricePair()">Add Price Pair</button>
          <button @click="listItems()">List Assets</button>
        </div>

    <div style="display: flex; justify-content: space-between; max-width: 60%; margin: 0 auto;">
      <span style="display: inline-block">
        <img src="./../assets/gold.jpg" width="250" height="250" />
        <h4>{{state.accountBalanceOfGold}}</h4>
        <div>
          <input v-if="state.isShopOwner" type="number" v-model="state.goldAddAmount" min="1" max="state.accountBalanceOfGold">
        </div>
      </span>
      <span style="display: inline-block">
        <img src="./../assets/silver.jpg" width="250" height="250" />
        <h4>{{state.accountBalanceOfSilver}}</h4>
        <input v-if="state.isShopOwner" type="number" v-model="state.silverAddAmount" min="1" max="state.accountBalanceOfSilver">
      </span>
      <span style="display: inline-block">
        <img src="./../assets/bronze.jpg" width="250" height="250" />
        <h4>{{state.accountBalanceOfBronze}}</h4>
        <input v-if="state.isShopOwner" type="number" v-model="state.bronzeAddAmount" min="1" max="state.accountBalanceOfBronze">
      </span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, reactive } from 'vue'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'

const GOLD_ID = 0
const SILVER_ID = 1
const BRONZE_ID = 2

const coinAddress = "0xd7Ee23a6501D7ba309b709f4357Ef4b0676628cC"
const gameItemAddress = "0xB503518aC8F222c85b4251Afe8B18189fEaBeA83"
const shopAddress= "0x6460168e8F609b0D9008107Fc884e32e04f92993"
const shopOwnerAddress= "0xE662f9575634dbbca894B756d1A19A851c824f00"
const nullAddress = '0x0000000000000000000000000000000000000000'

const getShopItem = async (itemId) => {
  return await state.shopContract.inventory(itemId.toString()).then(function(result) {
      return result
  })
}

const setItem = async (itemId) => {
  let item = await getShopItem(itemId)
  state[`item${itemId}`] = item
}

const setAccountBalanceOf = async (itemId) => {
  state.gameItemContract.balanceOf(window.ethereum.selectedAddress, itemId).then(function(result){
    if (itemId == 0) { state.accountBalanceOfGold = result.toNumber() }
    if (itemId == 1) { state.accountBalanceOfSilver = result.toNumber() }
    if (itemId == 2) { state.accountBalanceOfBronze = result.toNumber() }
  })
}

const itemObject = (item) => {
  return {
    token: item[0],
    id: item[1].toNumber(),
    amount: item[2].toNumber(),
  }
}

const connectWallet = async () => {
  await window.ethereum.enable()

  const ERC20Abi = await import('../abi/ERC20.json')
  const GameItemAbi = await import('../abi/GameItem.json')
  let ShopAbi = await import('../abi/Shop.json')

  let provider = new ethers.providers.Web3Provider(window.ethereum)
  let signer = await provider.getSigner()

  state.erc20Contract = new ethers.Contract(coinAddress, ERC20Abi.default, signer)
  state.gameItemContract = new ethers.Contract(gameItemAddress, GameItemAbi.default, signer)
  state.shopContract = new ethers.Contract(shopAddress, ShopAbi.default, signer)

  window.shopContract = state.shopContract
  window.gameItemContract = state.gameItemContract
  window.erc20Contract = state.erc20Contract

  state.shopContract.getInventoryCount().then(function(result){
    state.inventoryCount = result.toNumber()

    for (let i = 0; i < result.toNumber(); i++) {
      setItem(i)
    }
  })

  state.connected = true

  setAccountBalanceOf(GOLD_ID)
  setAccountBalanceOf(SILVER_ID)
  setAccountBalanceOf(BRONZE_ID)

  const address = window.ethereum.selectedAddress
  if (address.toLowerCase() == shopOwnerAddress.toLowerCase()) {
    state.isShopOwner = true

    state.newAssetPrice = 1
    state.newAssetAssetType = 1
    state.newAssetPricePairs = []

    state.newSilverPrice = 1
    state.newSilverAssetType = 1
    state.newSilverPricePairs = []

    state.newBronzePrice = 1
    state.newBronzeAssetType = 1
    state.newBronzePricePairs = []

    state.goldAddAmount = 0
    state.silverAddAmount = 0
    state.bronzeAddAmount = 0
  }
}

const connectButtonText = () => {
  if (state.connected) {
    return 'Connected ✔️'
  } else {
    return "Connect Account"
  }
}

const listItems = async () => {
  if (Math.max(state.goldAddAmount, state.silverAddAmount, state.bronzeAddAmount) == 0) {
    alert('must have a non-zero amount for an asset to add')
    return
  }
  if (state.newAssetPricePairs.length == 0) {
    alert('must add at least one price pair')
    return
  }

  // TODO: consolidate price pairs
  let pricePairs = state.newAssetPricePairs.map(pair => {
    const assetForPair = (assetType) => {
      if (assetType == 1) {
        return nullAddress
      } else {
        return coinAddress
      }
    }
    return (
      { assetType: BigNumber.from(pair.assetType),
        asset: assetForPair(pair.assetType),
        price: BigNumber.from(pair.price).mul(ethers.constants.WeiPerEther) }
    )
  })

  let items = [
    gameItemAddress,
  ];
  let ids = [];
  if (state.goldAddAmount > 0) { ids.push(GOLD_ID) }
  if (state.silverAddAmount > 0) { ids.push(SILVER_ID) }
  if (state.bronzeAddAmount > 0) { ids.push(BRONZE_ID) }
  let amounts = [];
  if (state.goldAddAmount > 0) { amounts.push(state.goldAddAmount) }
  if (state.silverAddAmount > 0) { amounts.push(state.silverAddAmount) }
  if (state.bronzeAddAmount > 0) { amounts.push(state.bronzeAddAmount) }

  const listCurrentItems = () => {
    state.shopContract.listItems(pricePairs, items, [ids], [amounts]).then(async (transaction) => {
      const receipt = await transaction.wait()
      let inventoryCount = Object.assign(state.inventoryCount)
      for (let i = 0; i < ids.length; i++) {
        inventoryCount++
        setItem(state.inventoryCount + i)
      }
      state.inventoryCount = inventoryCount
      ids.map(id => { setAccountBalanceOf(id) })
      state.newAssetPricePairs = []
    })
  }

  let isApproved;
  await state.gameItemContract.isApprovedForAll(shopOwnerAddress, shopAddress).then(result => {
    isApproved = result
  })

  if (isApproved) {
    listCurrentItems()
  } else {
    state.gameItemContract.setApprovalForAll(shopAddress, true).then(async (transaction) => {
      await transaction.wait()
      listCurrentItems()
    })
  }
}

const buyItem = async (itemId, amount, assetId, assetType, price) => {
  let options = {};
  let weiValue = BigNumber.from(amount).mul(price);

  if (assetType.toNumber() == 2) {
    let allowance;

  // TODO: support other ERC20s
    await state.erc20Contract.allowance(window.ethereum.selectedAddress, shopContract.address).then((result) => {
      allowance = result
    })

    if (weiValue.gt(allowance)) {
      await state.erc20Contract.approve(shopContract.address, weiValue).then(async (transaction) => {
        await transaction.wait()
      })
    }
  } else {
    options = { value: weiValue }
  }

  state.shopContract.purchaseItem(itemId, amount, assetId, options).then(async (transaction) => {
    await transaction.wait()
    setItem(itemId)
    setAccountBalanceOf(0)
    setAccountBalanceOf(1)
    setAccountBalanceOf(2)
  })
}

const addPricePair = (assetName) => {
  let currencyAddress = nullAddress
  if (state.newAssetAssetType == 2) {
    currencyAddress = coinAddress
  }
  state.newAssetPricePairs.push(
    { assetType: state.newAssetAssetType,
      address: currencyAddress,
      price: state.newAssetPrice }
  )
}

const removeListing = (itemId, amount) => {
  state.shopContract.removeItem(itemId, amount).then(async (transaction) => {
    const receipt = await transaction.wait();
    setItem(itemId)
    setAccountBalanceOf(itemObject(state[`item${itemId}`]).id)
  })
}

const displayPricePair = (pricePair) => {
  let result = {
    name: pricePair.asset == nullAddress ? 'ETH' : 'XMPL',
    price: pricePair.price
  }
  return result
}

const getPrices = async (itemId, priceId) => {
  let pricePairLengths = await state.shopContract.pricePairLengths(itemId).then((result) => {
    return result;
  })
  let pricePairs = []
  for (let i =0; i < pricePairLengths; i++) {
    await state.shopContract.prices(itemId, i).then((result) => {
      pricePairs.push(result)
    })
  }
  state[`itemPrices${itemId}`] = pricePairs
}

defineProps({
})

const state = reactive({
})
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
