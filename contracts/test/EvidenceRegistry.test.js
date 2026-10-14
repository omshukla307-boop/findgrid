const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FindGridEvidenceRegistry", function () {
  let registry;
  let owner;
  let investigator;
  let unauthorizedUser;

  // Sample SHA-256 hash (32 bytes)
  // sha256("FindGrid test evidence file content")
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("FindGrid test evidence file content"));
  const sampleCaseId = "FG-2026-TEST-001";
  const sampleType = "CCTV_SURVEILLANCE";

  beforeEach(async function () {
    [owner, investigator, unauthorizedUser] = await ethers.getSigners();

    const FindGridEvidenceRegistry = await ethers.getContractFactory("FindGridEvidenceRegistry");
    registry = await FindGridEvidenceRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment & Access Control", function () {
    it("Should set the deployer as owner and authorized investigator", async function () {
      expect(await registry.owner()).to.equal(owner.address);
      expect(await registry.authorizedInvestigators(owner.address)).to.be.true;
    });

    it("Should allow owner to authorize a new investigator", async function () {
      await expect(registry.authorizeInvestigator(investigator.address))
        .to.emit(registry, "InvestigatorAuthorized")
        .withArgs(investigator.address, owner.address);

      expect(await registry.authorizedInvestigators(investigator.address)).to.be.true;
    });

    it("Should prevent non-owner from authorizing an investigator", async function () {
      await expect(
        registry.connect(unauthorizedUser).authorizeInvestigator(investigator.address)
      ).to.be.revertedWith("FindGrid: caller is not the owner");
    });
  });

  describe("Evidence Registration", function () {
    beforeEach(async function () {
      await registry.authorizeInvestigator(investigator.address);
    });

    it("Should allow authorized investigator to register evidence hash", async function () {
      const tx = await registry.connect(investigator).registerEvidence(
        sampleHash,
        sampleCaseId,
        sampleType
      );
      await expect(tx)
        .to.emit(registry, "EvidenceRegistered")
        .withArgs(
          sampleHash,
          sampleCaseId,
          sampleType,
          investigator.address,
          await (await ethers.provider.getBlock("latest")).timestamp,
          await (await ethers.provider.getBlock("latest")).number
        );

      expect(await registry.totalEvidenceCount()).to.equal(1);
    });

    it("Should reject registration from unauthorized account", async function () {
      await expect(
        registry.connect(unauthorizedUser).registerEvidence(
          sampleHash,
          sampleCaseId,
          sampleType
        )
      ).to.be.revertedWith("FindGrid: caller is not an authorized investigator");
    });

    it("Should prevent duplicate evidence hash registration", async function () {
      await registry.connect(investigator).registerEvidence(
        sampleHash,
        sampleCaseId,
        sampleType
      );

      await expect(
        registry.connect(investigator).registerEvidence(
          sampleHash,
          sampleCaseId,
          sampleType
        )
      ).to.be.revertedWith("FindGrid: evidence hash already registered");
    });
  });

  describe("Integrity Verification", function () {
    beforeEach(async function () {
      await registry.authorizeInvestigator(investigator.address);
      await registry.connect(investigator).registerEvidence(
        sampleHash,
        sampleCaseId,
        sampleType
      );
    });

    it("Should verify existing evidence with full metadata", async function () {
      const result = await registry.verifyEvidence(sampleHash);
      expect(result.isValid).to.be.true;
      expect(result.registeredBy).to.equal(investigator.address);
      expect(result.caseId).to.equal(sampleCaseId);
      expect(result.evidenceType).to.equal(sampleType);
    });

    it("Should return false for tampered or unknown hash", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("TAMPERED CONTENT"));
      const result = await registry.verifyEvidence(tamperedHash);
      expect(result.isValid).to.be.false;
      expect(result.registeredBy).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Case Status Audit", function () {
    beforeEach(async function () {
      await registry.authorizeInvestigator(investigator.address);
    });

    it("Should record status audit and emit event", async function () {
      const tx = await registry.connect(investigator).recordStatusAudit(
        sampleCaseId,
        "Under Review",
        "Active Search",
        "Multiple verified sightings in sector 4"
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(registry, "CaseStatusAudited")
        .withArgs(
          sampleCaseId,
          "Under Review",
          "Active Search",
          "Multiple verified sightings in sector 4",
          investigator.address,
          block.timestamp
        );

      expect(await registry.totalAuditCount()).to.equal(1);
      expect(await registry.getCaseAuditCount(sampleCaseId)).to.equal(1);

      const auditEvent = await registry.getCaseAuditEvent(sampleCaseId, 0);
      expect(auditEvent.previousStatus).to.equal("Under Review");
      expect(auditEvent.newStatus).to.equal("Active Search");
    });
  });
});
