import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy AgentRegistry
  console.log("\nDeploying AgentRegistry...");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const registryAddress = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", registryAddress);

  // Deploy SyndicateVault
  console.log("\nDeploying SyndicateVault...");
  const SyndicateVault = await hre.ethers.getContractFactory("SyndicateVault");
  const syndicateVault = await SyndicateVault.deploy(registryAddress);
  await syndicateVault.waitForDeployment();
  const vaultAddress = await syndicateVault.getAddress();
  console.log("SyndicateVault deployed to:", vaultAddress);

  // Grant executor role to deployer for testing
  const EXECUTOR_ROLE = await syndicateVault.EXECUTOR_ROLE();
  await syndicateVault.grantRole(EXECUTOR_ROLE, deployer.address);
  console.log("Granted EXECUTOR_ROLE to deployer");

  console.log("\n=== Deployment Summary ===");
  console.log("AgentRegistry:", registryAddress);
  console.log("SyndicateVault:", vaultAddress);
  console.log("Deployer:", deployer.address);

  // Save addresses to file
  const fs = await import("fs");
  const network = await hre.ethers.provider.getNetwork();
  const addresses = {
    network: network.name,
    chainId: network.chainId.toString(),
    agentRegistry: registryAddress,
    syndicateVault: vaultAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployment-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
