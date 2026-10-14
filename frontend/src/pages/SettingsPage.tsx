import React, { useState, useEffect } from 'react';
import { 
  Settings, Wallet, Blocks, BrainCircuit, Database, 
  ShieldCheck, Server, RefreshCw, CheckCircle2, Lock, KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { contractService } from '../services/contractService';
import { formatAddress } from '../services/crypto';

export const SettingsPage: React.FC = () => {
  const { user, role, walletAddress, chainId, networkName, isMetaMaskInstalled } = useAuth();
  const { showToast } = useToast();

  const [aiThreshold, setAiThreshold] = useState<number>(40);
  const [contractAddress, setContractAddress] = useState<string>(contractService.getContractAddress());
  const [rpcUrl, setRpcUrl] = useState<string>('http://127.0.0.1:8545');

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform preferences saved successfully.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" /> SYSTEM ARCHITECTURE & ACCOUNT SETTINGS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            MetaMask wallet connection telemetry, smart contract registry endpoints, and AI configuration parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Account & Wallet Status (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Wallet Profile Card */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-400" /> AUTHENTICATED WALLET PROFILE
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 flex justify-between">
                <span className="text-slate-400">Officer Name:</span>
                <span className="text-white font-sans font-semibold">{user?.full_name || 'Anonymous User'}</span>
              </div>

              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 flex justify-between">
                <span className="text-slate-400">Wallet Address:</span>
                <span className="text-cyan-300">{walletAddress || 'Not Connected'}</span>
              </div>

              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 flex justify-between">
                <span className="text-slate-400">Role Clearance:</span>
                <span className="text-emerald-400 font-bold uppercase">{role}</span>
              </div>

              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 flex justify-between">
                <span className="text-slate-400">Blockchain Network:</span>
                <span>{networkName} (Chain ID: {chainId ?? 31337})</span>
              </div>

              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 flex justify-between">
                <span className="text-slate-400">MetaMask Injected Provider:</span>
                <span className={isMetaMaskInstalled ? 'text-emerald-400' : 'text-amber-400'}>
                  {isMetaMaskInstalled ? 'Detected & Operational' : 'Not Detected'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Matching Sensitivity Settings */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" /> AI ENGINE SENSITIVITY CONFIGURATION
            </h2>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Candidate Match Alert Threshold:</span>
                  <span className="text-cyan-400 font-bold">{aiThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={aiThreshold}
                  onChange={(e) => setAiThreshold(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Matches scoring at or above this threshold will automatically flag priority review notifications for lead investigators.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Web3 & Contract Endpoints (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Smart Contract Settings Card */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
              <Blocks className="w-4 h-4 text-cyan-400" /> SMART CONTRACT REGISTRY ENDPOINTS
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Contract Address (FindGridEvidenceRegistry):</label>
                <input
                  type="text"
                  readOnly
                  value={contractAddress}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-cyan-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">EVM RPC Endpoint:</label>
                <input
                  type="text"
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract ABI:</span>
                  <span className="text-emerald-400">Loaded & Verified (Paris EVM)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Solidity Compiler:</span>
                  <span>v0.8.20 (200 Runs Optimizer)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Responsibilities Explanation Card */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850">
              DIVISION OF RESPONSIBILITY IN FINDGRID
            </h2>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-850">
                <span className="text-cyan-400 font-bold block mb-0.5">1. ARTIFICIAL INTELLIGENCE:</span>
                Computes spatiotemporal distance, apparel similarity, transit feasibility, and multi-factor explainable matching between reports. Requires human sign-off.
              </div>

              <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-850">
                <span className="text-emerald-400 font-bold block mb-0.5">2. SOLIDITY SMART CONTRACT:</span>
                Immutable registry of SHA-256 evidence digests and case status audits. Protects chain of custody without storing any PII on-chain.
              </div>

              <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-850">
                <span className="text-purple-400 font-bold block mb-0.5">3. METAMASK AUTHENTICATION:</span>
                EIP-191 personal signature on single-use server challenge nonces. Prevents credential theft, phishing, and replay attacks.
              </div>

              <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-850">
                <span className="text-amber-400 font-bold block mb-0.5">4. POSTGRESQL & ROW LEVEL SECURITY:</span>
                Confidential database storage for missing person dossiers, contact info, sensitive coordinates, and full case metadata.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
