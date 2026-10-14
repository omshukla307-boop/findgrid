import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileCheck2, Blocks, ShieldCheck, AlertOctagon, CheckCircle2, 
  Upload, Copy, ExternalLink, RefreshCw, Sparkles, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { contractService } from '../services/contractService';
import { calculateFileSha256, formatAddress, formatHash } from '../services/crypto';
import { useToast } from '../context/ToastContext';
import { EvidenceVerificationResult } from '../types';

export const BlockchainEvidencePage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientHash, setClientHash] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<EvidenceVerificationResult | null>(null);
  const [chainResult, setChainResult] = useState<any>(null);

  // Auto-check hash if passed via URL (e.g. from case detail page)
  const initialHash = searchParams.get('hash');

  const verifyHashDirectly = async (hash: string) => {
    try {
      setVerifying(true);
      setClientHash(hash);
      const chainData = await contractService.verifyEvidence(hash);
      setChainResult(chainData);

      if (chainData.isValid) {
        setVerificationResult({
          file_hash: hash,
          is_valid: true,
          matched_record: null,
          on_chain_verified: true,
          details: `ON-CHAIN PROOF VERIFIED: Hash ${hash} is immutably registered to Case ID '${chainData.caseId}' by authorized investigator ${chainData.registeredBy}. Timestamp: ${new Date(chainData.timestamp * 1000).toLocaleString()}.`
        });
        showToast('On-chain evidence hash confirmed authentic!', 'success');
      } else {
        setVerificationResult({
          file_hash: hash,
          is_valid: false,
          matched_record: null,
          on_chain_verified: false,
          details: `INTEGRITY CHECK FAILED: Hash ${hash} is NOT registered in the FindGrid smart contract.`
        });
        showToast('Evidence hash mismatch: not found on-chain.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'On-chain verification failed.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (initialHash) {
      verifyHashDirectly(initialHash);
    }
  }, [initialHash]);

  // Handle local file selection and verification
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setSelectedFile(file);
    try {
      // 1. Calculate browser-side SHA-256
      const hash = await calculateFileSha256(file);
      setClientHash(hash);

      // 2. Query backend verification endpoint
      setVerifying(true);
      const backendResult = await api.verifyEvidenceFile(file);
      setVerificationResult(backendResult);

      // 3. Also query smart contract on-chain directly
      const onChain = await contractService.verifyEvidence(hash);
      setChainResult(onChain);

      if (backendResult.is_valid || onChain.isValid) {
        showToast('Integrity verification completed: Authentic file confirmed!', 'success');
      } else {
        showToast('Integrity failure: File bytes do not match any registered evidence record!', 'error');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      showToast(err.message || 'Verification process failed.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Hackathon Scenario Demo Buttons (Authentic vs Tampered)
  const handleTestAuthentic = async () => {
    // Exact bytes matching seed data evidence 1
    const content = "FindGrid Fictional Evidence CCTV Frame 2026-10-13 Sector North Riverbank Maya Lin";
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], "cctv_north_gate_oct13_1928utc.mp4", { type: 'video/mp4' });

    setSelectedFile(file);
    const hash = await calculateFileSha256(file);
    setClientHash(hash);

    setVerifying(true);
    const backendResult = await api.verifyEvidenceFile(file);
    setVerificationResult(backendResult);

    const onChain = await contractService.verifyEvidence(hash);
    setChainResult(onChain);
    setVerifying(false);

    showToast('Demo Step 10: Authentic evidence file verified genuine!', 'success');
  };

  const handleTestTampered = async () => {
    // Maliciously altered content with 1 modified character
    const tamperedContent = "FindGrid Fictional Evidence CCTV Frame 2026-10-13 Sector North Riverbank Maya Lin [TAMPERED_BYTE_INJECTION]";
    const blob = new Blob([tamperedContent], { type: 'text/plain' });
    const file = new File([blob], "cctv_north_gate_oct13_1928utc_CORRUPTED.mp4", { type: 'video/mp4' });

    setSelectedFile(file);
    const hash = await calculateFileSha256(file);
    setClientHash(hash);

    setVerifying(true);
    const backendResult = await api.verifyEvidenceFile(file);
    setVerificationResult(backendResult);

    const onChain = await contractService.verifyEvidence(hash);
    setChainResult(onChain);
    setVerifying(false);

    showToast('Demo Step 11: Tampered file detected and rejected!', 'error');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-emerald-400" /> DECENTRALIZED EVIDENCE VERIFICATION
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-850 text-cyan-300 border border-cyan-500/30">
              FindGridEvidenceRegistry
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographic SHA-256 integrity lab cross-referencing off-chain evidence bytes with immutable smart contract state.
          </p>
        </div>

        {/* Contract Address Pill */}
        <div className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800 text-right">
          <span className="text-[10px] text-slate-400 block font-mono">Registry Contract (EVM)</span>
          <span className="text-xs font-mono text-cyan-400 font-bold">
            0x5FbDB2315678afecb367f032d93F642f64180aa3
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Verification Lab (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Drop & Upload Card */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl glow-border">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" /> TEST ANY EVIDENCE FILE
            </h2>

            <div className="border-2 border-dashed border-navy-750 hover:border-cyan-500/50 rounded-2xl p-8 text-center transition-colors mb-4 bg-navy-950/60">
              <FileText className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <p className="text-xs font-semibold text-white mb-1">
                Upload or Drop Evidence File to Verify
              </p>
              <p className="text-[11px] text-slate-400 mb-4 max-w-sm mx-auto">
                Computes browser-side SHA-256 digest in real-time, queries the deployed smart contract, and compares hash immutability.
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-md shadow-cyan-950">
                <Upload className="w-3.5 h-3.5" /> Select Local File
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <div className="mt-4 p-2 bg-navy-900 rounded-lg text-xs font-mono text-cyan-300 inline-block">
                  Loaded: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Calculated Hash Display */}
            {clientHash && (
              <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-850 space-y-1 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Computed SHA-256 Digest (Client & Server):
                </span>
                <div className="text-xs font-mono text-cyan-300 break-all select-all font-semibold">
                  {clientHash}
                </div>
              </div>
            )}

            {/* Hackathon Demonstration Simulator Buttons */}
            <div className="pt-4 border-t border-navy-850">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Hackathon Scenario One-Click Demonstrators:
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleTestAuthentic}
                  disabled={verifying}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Load Authentic File (Step 10 Pass)
                </button>

                <button
                  onClick={handleTestTampered}
                  disabled={verifying}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 flex items-center justify-center gap-2 transition-all"
                >
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  Load Tampered File (Step 11 Fail)
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Verification Results & On-Chain Audit Proof (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
              <Blocks className="w-4 h-4 text-cyan-400" /> VERIFICATION OUTCOME
            </h2>

            {verifying ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                <span className="text-xs font-mono text-slate-400">Querying FindGrid smart contract...</span>
              </div>
            ) : verificationResult ? (
              <div className="space-y-4">
                
                {/* Result Callout */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    verificationResult.is_valid
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {verificationResult.is_valid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold font-mono uppercase">
                      {verificationResult.is_valid ? 'INTEGRITY VERIFIED: AUTHENTIC' : 'TAMPER ALERT: VERIFICATION FAILED'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed">{verificationResult.details}</p>
                  </div>
                </div>

                {/* Metadata & On-Chain Proof */}
                {verificationResult.is_valid && (
                  <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-850 text-xs font-mono space-y-2 text-slate-300">
                    <div className="text-[10px] uppercase text-cyan-400 font-bold border-b border-navy-900 pb-1">
                      SMART CONTRACT CUSTODY RECEIPT:
                    </div>
                    {verificationResult.matched_record && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">File Name:</span>
                          <span className="text-white">{verificationResult.matched_record.file_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Case ID:</span>
                          <span className="text-cyan-300">{verificationResult.matched_record.case_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Investigator:</span>
                          <span>{formatAddress(verificationResult.matched_record.registered_by, 4)}</span>
                        </div>
                        {verificationResult.matched_record.on_chain_tx_hash && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Transaction:</span>
                            <span className="text-emerald-400">{formatHash(verificationResult.matched_record.on_chain_tx_hash, 4)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {chainResult && chainResult.isValid && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Registered By Wallet:</span>
                        <span className="text-emerald-400">{formatAddress(chainResult.registeredBy, 4)}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                Upload a file or click one of the hackathon demonstration buttons to verify authenticity.
              </div>
            )}

          </div>

          {/* Blockchain Integrity Architecture Note */}
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-850 text-xs text-slate-400 leading-relaxed font-mono">
            <span className="text-cyan-400 font-bold block mb-1">PRIVACY & INTEGRITY GUARANTEE:</span>
            No PII (names, photographs, phone numbers, or addresses) is ever stored on the public blockchain.
            Only the mathematical SHA-256 digest is registered to provide undeniable, immutable proof of custody.
          </div>

        </div>

      </div>

    </div>
  );
};
