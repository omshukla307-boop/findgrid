import React from 'react';
import { Shield, Cpu, Blocks, Radio, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 border-t border-navy-800 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-navy-900 border border-cyan-500/40 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="font-bold text-white font-mono tracking-wider">FINDGRID</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              AI-Powered Missing Person Search & Coordination Platform with decentralized blockchain evidence verification.
            </p>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-slate-200 font-mono text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Similarity Engine
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Multi-factor spatiotemporal proximity, apparel cross-correlation, and explainable scoring with human review gates.
            </p>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-slate-200 font-mono text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Blocks className="w-3.5 h-3.5 text-cyan-400" /> Smart Contract
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              FindGridEvidenceRegistry
              <span className="block text-[10px] text-cyan-400 truncate mt-0.5">
                0x5FbDB2315678afecb367f032d93F642f64180aa3
              </span>
            </p>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-slate-200 font-mono text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> System Status
            </h4>
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span>FastAPI Backend:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Blockchain Node:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> EVM Active (31337)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cryptographic Hashing:</span>
                <span className="text-cyan-400">SHA-256 (EVM bytes32)</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-navy-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 FindGrid Incident Response Platform. All records demonstrated are synthetic and fictional for hackathon verification.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">MetaMask EIP-191 Verified</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Leaflet OpenStreetMap</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Supabase RLS Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
