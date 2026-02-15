const { ethers } = require("ethers");
require("dotenv").config();

console.log("RPC:", process.env.RPC_URL);
console.log("ADDRESS:", process.env.CONTRACT_ADDRESS);
console.log("PK:", process.env.PRIVATE_KEY_REGISTRY);


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const registryWallet = new ethers.Wallet(
  process.env.PRIVATE_KEY_REGISTRY,
  provider
);

const contractABI = require("../../../artifacts/contracts/SAFMarketplace.sol/SAFMarketplace.json").abi;



const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  registryWallet
);

module.exports = {
  provider,
  contract,
  registryWallet,
};
