import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Checking wallet:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Wallet has 0 balance!");
    console.log("Please fund your wallet with testnet ETH from:");
    console.log("  - https://faucet.quicknode.com/arbitrum/sepolia");
    console.log("  - https://www.alchemy.com/faucets/arbitrum-sepolia");
  } else {
    console.log("\n✅ Wallet is funded and ready for deployment!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
