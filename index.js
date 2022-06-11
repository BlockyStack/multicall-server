const express = require("express");
const app = express();
const { ethers } = require("ethers");

// prettier-ignore
const multicallAbi = [ { constant: false, inputs: [ { components: [ { name: "target", type: "address" }, { name: "callData", type: "bytes" }, ], name: "calls", type: "tuple[]", }, ], name: "aggregate", outputs: [ { name: "blockNumber", type: "uint256" }, { name: "returnData", type: "bytes[]" }, ], payable: false, stateMutability: "nonpayable", type: "function", }, ];
const multicallAddress = "0x536aB104c3139E55934b9cF92f1C205E152d3338";
const nftAddress = "0x91644644403a5a13C5198D8DaD89247902D2216E";
const colors = [15871728, 7568050, 4569411, 11405820, 3360049, 16138689, 136997, 4120913, 11713506, 3630703, 4933811, 10076521, 4682532, 14276975, 11188703, 13548226, 10560208, 6185744, 15110461, 13069540, 5951360, 3606005, 5455418, 3615956, 16085792, 6891072, 2622815, 2786648, 15987782, 15805679, 4584786, 6755357, 7993420, 3103294, 16110926, 8880212, 10754187, 4394690, 13232441, 2358177, 2326725, 2340918, 1419388, 13933594, 5880400, 14773509, 3018072, 11686040, 5792667, 11480749, 15215219, 3269142, 7174422, 14048782, 3558346, 5584033, 439842, 5471193, 6004717, 12764574, 10956759, 11604872, 15412043, 3360502, 3033330, 9731527, 2179295, 12045939, 7651001, 14423041, 12559293, 1830908, 9376175, 7025247, 5776135, 101028, 1725974, 11520066, 16041247, 11486509, 14749352, 3953596, 13876629, 7445714, 11272037, 3435077, 2960009, 9203116, 13505402, 435716, 3266341, 3905439, 4769440, 7259741, 329864, 3985302, 11408032, 8331341, 7647232, 1079598];
const provider = new ethers.providers.JsonRpcProvider("https://testnet.emerald.oasis.dev");

app.get("/", async function (req, res) {
  try {
    const response = await getMulticall()
    res.send({response});
  } catch {
    res.status(500).send({
     response: [] 
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
        response.push(multicall[i].id);
      }
    }
    res.send({response});
  } catch (error) {
    res.status(500).send({
     response: [] 
    });
  }
});

async function getMulticall() {
  const multicallContract = new ethers.Contract(multicallAddress, multicallAbi, provider);
  const multicallArgs = generateCallData().map((callData) => {
    return {
      target: nftAddress,
      callData,
    };
  });
  const multicall = await multicallContract.callStatic["aggregate"](multicallArgs);
  return multicall.returnData.map((val, index) => {
    return {
      id: colors[index],
      owner: "0x" + val.slice(26).toLowerCase(),
    };
  });
}

function generateCallData() {
  return colors.map((val) => {
    const hex = val.toString(16);
    const ownerOf = "0x6352211e0000000000000000000000000000000000000000000000000000000000000000";
    const callData = ownerOf.slice(0, -1 * hex.length) + hex;
    return callData;
  });
}

app.listen(process.env.PORT || 3000);
