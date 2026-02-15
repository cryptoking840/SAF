const hre = require("hardhat");

async function main() {
  const SAFMarketplace = await hre.ethers.getContractFactory("SAFMarketplace");

  const contract = await SAFMarketplace.deploy();

  await contract.waitForDeployment();   // ✅ correct for ethers v6

  const address = await contract.getAddress();

  console.log("SAFMarketplace deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
