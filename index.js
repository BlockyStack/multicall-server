const express = require("express");
const app = express();
var cors = require("cors");
const { ethers } = require("ethers");
const axios = require("axios");
app.use(cors());

// prettier-ignore
const multicallAbi = [ { "inputs": [ { "components": [ { "internalType": "address", "name": "target", "type": "address" }, { "internalType": "bytes", "name": "callData", "type": "bytes" } ], "internalType": "struct Multicall2.Call[]", "name": "calls", "type": "tuple[]" } ], "name": "aggregate", "outputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" }, { "internalType": "bytes[]", "name": "returnData", "type": "bytes[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "components": [ { "internalType": "address", "name": "target", "type": "address" }, { "internalType": "bytes", "name": "callData", "type": "bytes" } ], "internalType": "struct Multicall2.Call[]", "name": "calls", "type": "tuple[]" } ], "name": "blockAndAggregate", "outputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" }, { "internalType": "bytes32", "name": "blockHash", "type": "bytes32" }, { "components": [ { "internalType": "bool", "name": "success", "type": "bool" }, { "internalType": "bytes", "name": "returnData", "type": "bytes" } ], "internalType": "struct Multicall2.Result[]", "name": "returnData", "type": "tuple[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" } ], "name": "getBlockHash", "outputs": [ { "internalType": "bytes32", "name": "blockHash", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getBlockNumber", "outputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCurrentBlockCoinbase", "outputs": [ { "internalType": "address", "name": "coinbase", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCurrentBlockDifficulty", "outputs": [ { "internalType": "uint256", "name": "difficulty", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCurrentBlockGasLimit", "outputs": [ { "internalType": "uint256", "name": "gaslimit", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCurrentBlockTimestamp", "outputs": [ { "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "addr", "type": "address" } ], "name": "getEthBalance", "outputs": [ { "internalType": "uint256", "name": "balance", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getLastBlockHash", "outputs": [ { "internalType": "bytes32", "name": "blockHash", "type": "bytes32" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bool", "name": "requireSuccess", "type": "bool" }, { "components": [ { "internalType": "address", "name": "target", "type": "address" }, { "internalType": "bytes", "name": "callData", "type": "bytes" } ], "internalType": "struct Multicall2.Call[]", "name": "calls", "type": "tuple[]" } ], "name": "tryAggregate", "outputs": [ { "components": [ { "internalType": "bool", "name": "success", "type": "bool" }, { "internalType": "bytes", "name": "returnData", "type": "bytes" } ], "internalType": "struct Multicall2.Result[]", "name": "returnData", "type": "tuple[]" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bool", "name": "requireSuccess", "type": "bool" }, { "components": [ { "internalType": "address", "name": "target", "type": "address" }, { "internalType": "bytes", "name": "callData", "type": "bytes" } ], "internalType": "struct Multicall2.Call[]", "name": "calls", "type": "tuple[]" } ], "name": "tryBlockAndAggregate", "outputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" }, { "internalType": "bytes32", "name": "blockHash", "type": "bytes32" }, { "components": [ { "internalType": "bool", "name": "success", "type": "bool" }, { "internalType": "bytes", "name": "returnData", "type": "bytes" } ], "internalType": "struct Multicall2.Result[]", "name": "returnData", "type": "tuple[]" } ], "stateMutability": "nonpayable", "type": "function" } ]; 
// testnet 0x536aB104c3139E55934b9cF92f1C205E152d3338
const multicallAddress = "0xA75e40527A55a9eb0C08896C993B0CAdd5cDc18F";
// testnet 0x91644644403a5a13C5198D8DaD89247902D2216E
const nftAddress = "0xB24FAc36d21cc4B322b06F4bdA2Ac0FC4C57b672";
// testnet https://testnet.emerald.oasis.dev
const provider = new ethers.providers.JsonRpcProvider("https://emerald.oasis.dev");
const url = "https://raw.githubusercontent.com/oasis-stack/data/main/json/int.json";

app.get("/", async function (req, res) {
  try {
    const response = await getMulticall();
    res.send({ response });
  } catch {
    res.status(500).send({
      response: [],
    });
  }
});

app.get("/owner", async function (req, res) {
  // get address from query
  try {
    const address = req.query.address.toLowerCase();
    const multicall = await getMulticall();
    const response = [];
    for (let i = 0; i < multicall.length; i++) {
      if (multicall[i].owner === address) {
        response.push(multicall[i].hex);
      }
    }
    res.send({ response });
  } catch (error) {
    res.status(500).send({
      response: [],
    });
  }
});

async function getMulticall() {
  const multicallContract = new ethers.Contract(multicallAddress, multicallAbi, provider);
  const colors = await axios.get(url).then((res) => res.data)
  const multicallArgs = generateCallData(colors).map((callData) => {
    return {
      target: nftAddress,
      callData,
    };
  });
  const multicall = await multicallContract.callStatic["aggregate"](multicallArgs);
  return multicall.returnData.map((val, index) => {
    return {
      id: colors[index],
      hex: "#" + colors[index].toString(16).padStart(6, "0"),
      owner: "0x" + val.slice(26).toLowerCase(),
    };
  });
}

function generateCallData(colors) {
  return colors.map((val) => {
    const hex = val.toString(16);
    const ownerOf = "0x6352211e0000000000000000000000000000000000000000000000000000000000000000";
    const callData = ownerOf.slice(0, -1 * hex.length) + hex;
    return callData;
  });
}

app.listen(process.env.PORT || 3000);
