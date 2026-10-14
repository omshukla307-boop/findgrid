import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Wallet, ShieldCheck, UserCheck, AlertTriangle, 
  CheckCircle2, ArrowRight, Lock, KeyRound, Sparkles,
  Radio, Shield, BrainCircuit, FileCheck2, Info,
  HeartHandshake, QrCode, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAddress } from '../services/crypto';
import { CitizenQRScannerModal } from '../components/CitizenQRScannerModal';

export const LoginPage: React.FC = () => {
  const { 
    user, walletAddress, chainId, networkName, isAuthenticated, 
    isConnecting, isMetaMaskInstalled, connectAndSignWithMetaMask, 
    loginAsDemoRole, logout 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth method tab: 'citizen' (Community Email & Password) or 'admin' (Admin MetaMask Cryptographic)
  const [activeTab, setActiveTab] = useState<'citizen' | 'admin'>('citizen');
  
  // Citizen QR & Face ID modal state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated, forward to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleMetaMaskAuth = async () => {
    try {
      setErrorMsg(null);
      await connectAndSignWithMetaMask();
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'MetaMask signature authentication failed.');
    }
  };

  const handleDemoMetaMaskAuth = async (role: 'admin' | 'investigator' | 'volunteer') => {
    try {
      setErrorMsg(null);
      await loginAsDemoRole(role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo authentication failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full">
        
        {/* Header & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-4">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>INCIDENT COMMAND GATEWAY • STEP 1</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">FindGrid</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Emergency missing person coordination, spatiotemporal AI correlation, and tamper-evident blockchain evidence registry.
          </p>

          {/* Quick status pill bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-mono text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800">
              <HeartHandshake className="w-3 h-3 text-cyan-400" /> Community Portal
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800">
              <BrainCircuit className="w-3 h-3 text-purple-400" /> AI Engine Online
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800">
              <FileCheck2 className="w-3 h-3 text-emerald-400" /> Solidity Registry
            </span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Authentication Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Authenticated State Card (shown if already logged in) */}
        {isAuthenticated ? (
          <div className="p-6 rounded-2xl bg-navy-900 border border-emerald-500/40 shadow-xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Currently Authenticated</h3>
                <p className="text-xs text-emerald-400 font-mono">Role: {user?.role.toUpperCase()}</p>
              </div>
            </div>

            <div className="p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs font-mono space-y-1 mb-6 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="text-white">{user?.full_name || 'Community Responder'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wallet / Identity:</span>
                <span className="text-cyan-300">{formatAddress(user?.wallet_address || '', 6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span>{networkName} ({chainId ?? 31337})</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950 cursor-pointer"
              >
                Proceed to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-rose-300 border border-navy-700 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Dual Authentication Gateway */
          <div className="mb-6">
            
            {/* Tabs Selector: Citizen / Community vs. Web3 MetaMask */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-navy-900 border border-navy-800 mb-6">
              
              {/* Tab 1: Citizen / Normal Peoples */}
              <button
                onClick={() => { setActiveTab('citizen'); setErrorMsg(null); }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'citizen'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-navy-850'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>Community & Citizen</span>
              </button>

              {/* Tab 2: Admin Access */}
              <button
                onClick={() => { setActiveTab('admin'); setErrorMsg(null); }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-navy-850'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Admin</span>
              </button>

            </div>

            {/* TAB 1 CONTENT: Normal People / Citizen - Mandatory QR & Face Verification Portal */}
            {activeTab === 'citizen' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl glow-border">
                
                <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      Citizen & Volunteer Access Portal
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mandatory optical identity and live biometric face verification protocol.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 whitespace-nowrap hidden sm:inline-block">
                    BIOMETRIC GATED
                  </span>
                </div>

                {/* Verification requirement warning banner */}
                <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Identity Verification Required for Entry</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        To protect sensitive missing person investigations, all civilian responders and volunteers must authenticate via their Emergency QR Code and pass live camera biometric facial verification.
                      </p>
                    </div>
                  </div>

                  {/* 3-Step Verification Pipeline */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-navy-900 text-[10px] font-mono text-center">
                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-cyan-400 block font-bold">STEP 1</span>
                      <span className="text-slate-300">Scan QR Code</span>
                    </div>
                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-emerald-400 block font-bold">STEP 2</span>
                      <span className="text-slate-300">Live Face Camera</span>
                    </div>
                    <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
                      <span className="text-purple-400 block font-bold">STEP 3</span>
                      <span className="text-slate-300">Enter Platform</span>
                    </div>
                  </div>
                </div>

                {/* Primary Mandatory Entry Action */}
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); setIsQRScannerOpen(true); }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-white group-hover:scale-110 transition-transform">
                    <QrCode className="w-5 h-5 text-emerald-300" />
                    <Camera className="w-5 h-5 text-cyan-200" />
                  </div>
                  <span>Scan Citizen QR & Verify Face to Enter</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[10px] text-slate-400 text-center mt-3 font-mono">
                  Direct entry without emergency QR scan & physical camera verification is restricted.
                </p>

              </div>
            )}

            {/* TAB 2 CONTENT: Admin Cryptographic Sign In */}
            {activeTab === 'admin' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl glow-border">
                
                <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-bold text-white">Admin Command Sign-In</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    METAMASK VERIFIED
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-xs text-slate-300">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block mb-0.5">Admin Cryptographic Challenge</span>
                      System administrators and lead investigators authenticate via MetaMask (EIP-191) cryptographic challenge with zero private key exposure.
                    </div>
                  </div>

                  {isMetaMaskInstalled ? (
                    <div className="p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs font-mono text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">MetaMask Extension:</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Detected & Ready
                        </span>
                      </div>
                      {walletAddress && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Address:</span>
                          <span className="text-cyan-400">{formatAddress(walletAddress, 6)}</span>
                        </div>
                      )}
                      {networkName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Network:</span>
                          <span>{networkName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>MetaMask not detected. You can use the "Community & Citizen" tab or the 1-Click Evaluation Profiles below.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleMetaMaskAuth}
                  disabled={isConnecting}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  {isConnecting ? 'Verifying Challenge Signature...' : 'Sign In as Admin (MetaMask)'}
                </button>
              </div>
            )}

          </div>
        )}

        {/* Development Demo Login Section */}
        <div className="p-6 rounded-2xl bg-navy-900/60 border border-navy-800 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Hackathon Evaluation Demo Profiles
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Evaluate role-based permissions instantly with pre-seeded test accounts:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Demo Investigator */}
            <button
              onClick={() => handleDemoMetaMaskAuth('investigator')}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">Investigator</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded">Lead</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Det. Marcus Reed</span>
              <span className="text-[10px] text-slate-500 font-mono block">marcus.reed@...</span>
            </button>

            {/* Demo Administrator */}
            <button
              onClick={() => handleDemoMetaMaskAuth('admin')}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-purple-500/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-purple-300">Admin</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-950 text-purple-400 rounded">Full</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Elena Vance</span>
              <span className="text-[10px] text-slate-500 font-mono block">elena.vance@...</span>
            </button>

            {/* Demo Volunteer - Strictly gated through QR & Biometric verification */}
            <button
              onClick={() => { setErrorMsg(null); setIsQRScannerOpen(true); }}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">Citizen / Vol.</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded">Biometric</span>
              </div>
              <span className="text-[10px] text-slate-300 block truncate">Citizen Responder</span>
              <span className="text-[10px] text-cyan-400 font-mono block">QR & Face Cam Required</span>
            </button>

          </div>
        </div>

        {/* Footer info & Overview link */}
        <div className="text-center">
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Learn more about FindGrid architecture & smart contract design</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Citizen QR Code Scanner & Biometric Face Verification Modal */}
        <CitizenQRScannerModal
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
        />

      </div>
    </div>
  );
};
