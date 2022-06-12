const express = require("express");
const app = express();
var cors = require("cors");
const { ethers } = require("ethers");
const axios = require("axios");
app.use(cors());

// prettier-ignore
const multicallAbi = [ { constant: false, inputs: [ { components: [ { name: "target", type: "address" }, { name: "callData", type: "bytes" }, ], name: "calls", type: "tuple[]", }, ], name: "aggregate", outputs: [ { name: "blockNumber", type: "uint256" }, { name: "returnData", type: "bytes[]" }, ], payable: false, stateMutability: "nonpayable", type: "function", }, ];
const multicallAddress = "0x536aB104c3139E55934b9cF92f1C205E152d3338";
const nftAddress = "0x91644644403a5a13C5198D8DaD89247902D2216E";
const provider = new ethers.providers.JsonRpcProvider("https://testnet.emerald.oasis.dev");
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
