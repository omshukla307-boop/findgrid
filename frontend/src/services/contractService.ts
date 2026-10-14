import { ethers } from 'ethers';
import contractArtifact from '../contracts/FindGridEvidenceRegistry.json';

// Local Hardhat default contract address fallback if not updated
const CONTRACT_ADDRESS = contractArtifact.address || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const CONTRACT_ABI = contractArtifact.abi;

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface ChainVerificationResult {
  isValid: boolean;
  registeredBy: string;
  timestamp: number;
  blockNumber: number;
  caseId: string;
  evidenceType: string;
}

export const contractService = {
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  },

  async getProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider> {
    if (this.isMetaMaskInstalled()) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    // Fallback to local RPC
    return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  },

  async getSigner(): Promise<ethers.Signer> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to perform blockchain operations.');
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  },

  async getReadOnlyContract(): Promise<ethers.Contract> {
    const provider = await this.getProvider();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  },

  async getWritableContract(): Promise<ethers.Contract> {
    const signer = await this.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  },

  /**
   * Register evidence hash on-chain
   * @param evidenceHash 32-byte hex string (with or without 0x)
   * @param caseId Case identifier string (e.g. FG-2026-0811)
   * @param evidenceType Short type descriptor
   */
  async registerEvidence(
    evidenceHash: string,
    caseId: string,
    evidenceType: string = 'DIGITAL_EVIDENCE'
  ): Promise<{ txHash: string; blockNumber: number }> {
    const contract = await this.getWritableContract();

    // Ensure 0x prefix and exact 32 bytes format
    const formattedHash = evidenceHash.startsWith('0x') ? evidenceHash : `0x${evidenceHash}`;
    const bytes32Hash = ethers.zeroPadValue(formattedHash, 32);

    const tx = await contract.registerEvidence(bytes32Hash, caseId, evidenceType);
    const receipt = await tx.wait();

    return {
      txHash: tx.hash,
      blockNumber: receipt?.blockNumber ?? 0,
    };
  },

  /**
   * Directly verify whether a hash is registered on-chain
   */
  async verifyEvidence(evidenceHash: string): Promise<ChainVerificationResult> {
    try {
      const contract = await this.getReadOnlyContract();
      const formattedHash = evidenceHash.startsWith('0x') ? evidenceHash : `0x${evidenceHash}`;
      const bytes32Hash = ethers.zeroPadValue(formattedHash, 32);

      const result = await contract.verifyEvidence(bytes32Hash);
      return {
        isValid: Boolean(result[0]),
        registeredBy: result[1],
        timestamp: Number(result[2]),
        blockNumber: Number(result[3]),
        caseId: result[4],
        evidenceType: result[5],
      };
    } catch (err: any) {
      console.warn('On-chain verification query returned error or local blockchain is offline:', err);
      return {
        isValid: false,
        registeredBy: ethers.ZeroAddress,
        timestamp: 0,
        blockNumber: 0,
        caseId: '',
        evidenceType: '',
      };
    }
  },

  /**
   * Record authorized case status audit event on-chain
   */
  async recordStatusAudit(
    caseId: string,
    previousStatus: string,
    newStatus: string,
    reason: string
  ): Promise<{ txHash: string }> {
    const contract = await this.getWritableContract();
    const tx = await contract.recordStatusAudit(caseId, previousStatus, newStatus, reason);
    await tx.wait();
    return { txHash: tx.hash };
  },

  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  },
};
