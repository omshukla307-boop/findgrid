import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Radio, BrainCircuit, Blocks, MapPin, 
  ArrowRight, Eye, CheckCircle2, Search, FileCheck2,
  Users, ChevronRight, Activity, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

export const LandingPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(err => console.warn('Could not load landing stats:', err));
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-navy-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-navy-950 to-navy-950 -z-10" />
        
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10"
          style={{
            backgroundImage: `linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-8 glow-border">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>FINDGRID INCIDENT RESPONSE ACTIVE</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">HARDHAT EVM 31337</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                AI-Powered Search & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400">
                  Decentralized Evidence
                </span> Coordination
              </h1>
              
              <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
                FindGrid connects emergency investigators, field search volunteers, and community reporters.
                Powered by explainable multi-factor AI similarity matching, geospatial sector search, and tamper-evident Solidity smart contracts.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-10">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950 transition-all hover:scale-[1.02]"
                >
                  <Shield className="w-4 h-4" /> Incident Command Dashboard
                </Link>

                <Link
                  to="/sightings"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-850 border border-cyan-500/40 text-cyan-300 font-semibold text-sm transition-all hover:scale-[1.02]"
                >
                  <Eye className="w-4 h-4" /> Report a Sighting
                </Link>

                <Link
                  to="/blockchain"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-navy-900/60 hover:bg-navy-900 border border-navy-700 text-slate-300 font-medium text-sm transition-all"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" /> Verify Evidence
                </Link>
              </div>

              {/* Verified Features Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>MetaMask EIP-191 Auth</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Explainable AI Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Solidity Hash Registry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Interactive Leaflet GIS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Role-Based RLS Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Zero-PII On-Chain</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Operational Telemetry Card */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-navy-800 shadow-2xl relative glow-border">
                <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold tracking-wider text-white">REAL-TIME OPERATIONAL GRID</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    LIVE SYSTEM
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                    <span className="text-[11px] text-slate-400 block mb-1">Active Missing Cases</span>
                    <span className="text-2xl font-black text-white font-mono">
                      {analytics?.total_active_cases ?? 3}
                    </span>
                    <span className="text-[10px] text-rose-400 block mt-1">2 Urgent / Critical</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                    <span className="text-[11px] text-slate-400 block mb-1">Verified Sightings</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {analytics?.total_sightings ?? 3}
                    </span>
                    <span className="text-[10px] text-cyan-400 block mt-1">Crowdsourced Inputs</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                    <span className="text-[11px] text-slate-400 block mb-1">AI Correlation Matches</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {analytics?.potential_matches_pending ?? 2}
                    </span>
                    <span className="text-[10px] text-amber-400 block mt-1">Awaiting Human Review</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                    <span className="text-[11px] text-slate-400 block mb-1">On-Chain Evidence</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {analytics?.blockchain_verified_count ?? 2}
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-1">SHA-256 Tamper-Proof</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950/80 border border-cyan-500/20 text-xs font-mono text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Evidence Contract:</span>
                  </div>
                  <span className="text-cyan-400 text-[11px]">0x5FbDB...80aa3</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-16 bg-navy-900/40 border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">INTEGRATED ARCHITECTURE</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Genuine Integration of Web3, AI & GIS</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1: AI Engine */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Explainable AI Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                Computes cosine text similarity, apparel classification, Haversine geospatial proximity, and temporal velocity feasibility with full factor transparency.
              </p>
              <Link to="/ai-matching" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                Explore AI Matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pillar 2: Blockchain */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
                <Blocks className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Solidity Evidence Registry</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                Files are hashed with SHA-256 and committed on-chain. Provides cryptographic proof of custody and detects any bit-level tampering.
              </p>
              <Link to="/blockchain" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                Verify Evidence Hashes <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pillar 3: Interactive Mapping */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Leaflet GIS Search Zones</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                Interactive OpenStreetMap grid tracking last-seen coordinates, verified sightings, and operational circular search zones for ground crews.
              </p>
              <Link to="/map" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Open Search Map <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pillar 4: MetaMask & Security */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/40 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">MetaMask Challenge Auth</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                Single-use server challenge nonces verified with EIP-191 signatures. Protects investigators and volunteers with zero seed phrase exposure.
              </p>
              <Link to="/login" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                Authenticate Wallet <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* End-to-End Hackathon Demo Flow Preview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-navy-900/60 border border-navy-800">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">EVALUATION GUIDE</h3>
            <h2 className="text-2xl font-bold text-white mb-6">Complete End-to-End Demonstration Flow</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                <span className="text-xs font-mono text-cyan-400 font-bold block mb-1">STAGE 1: AUTH & CASE OPENING</span>
                <p className="text-xs text-slate-300 mb-2">
                  Connect MetaMask wallet or trigger 1-click Demo Investigator Login. Create missing person case with urgency level and last-seen coordinates.
                </p>
                <Link to="/login" className="text-xs text-cyan-400 hover:underline">Start at Login &rarr;</Link>
              </div>

              <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                <span className="text-xs font-mono text-cyan-400 font-bold block mb-1">STAGE 2: AI MATCHING & REVIEW</span>
                <p className="text-xs text-slate-300 mb-2">
                  Volunteer submits a sighting. AI engine evaluates spatiotemporal & apparel overlap, outputs explainable score, and investigator reviews candidate match.
                </p>
                <Link to="/ai-matching" className="text-xs text-cyan-400 hover:underline">View AI Dashboard &rarr;</Link>
              </div>

              <div className="p-4 rounded-xl bg-navy-950 border border-navy-850">
                <span className="text-xs font-mono text-cyan-400 font-bold block mb-1">STAGE 3: BLOCKCHAIN VERIFICATION</span>
                <p className="text-xs text-slate-300 mb-2">
                  Investigator secures evidence hash on FindGridEvidenceRegistry contract. Verification lab confirms original file passes and altered file fails.
                </p>
                <Link to="/blockchain" className="text-xs text-cyan-400 hover:underline">Run Verification Lab &rarr;</Link>
              </div>

            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
