const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying FindGridEvidenceRegistry smart contract...");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const FindGridEvidenceRegistry = await hre.ethers.getContractFactory("FindGridEvidenceRegistry");
  const registry = await FindGridEvidenceRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("FindGridEvidenceRegistry deployed to:", registryAddress);

  // Authorize demo investigator account if on local network (Hardhat account #1)
  const signers = await hre.ethers.getSigners();
  if (signers.length > 1) {
    const investigatorAccount = signers[1].address;
    console.log(`Authorizing default demo investigator (${investigatorAccount})...`);
    const tx = await registry.authorizeInvestigator(investigatorAccount);
    await tx.wait();
    console.log("Demo investigator authorized successfully.");
  }

  // Export ABI and address for Frontend & Backend integration
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FindGridEvidenceRegistry.sol/FindGridEvidenceRegistry.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const deploymentInfo = {
      address: registryAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId || 31337,
      abi: artifact.abi,
      deployedAt: new Date().toISOString(),
    };

    // Save to frontend contracts folder
    const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(frontendDir, "FindGridEvidenceRegistry.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Contract artifact saved to frontend/src/contracts/FindGridEvidenceRegistry.json");

    // Also save in contracts directory
    fs.writeFileSync(
      path.join(__dirname, "../deployed-address.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
  }

  console.log("Deployment completed successfully.");
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});
