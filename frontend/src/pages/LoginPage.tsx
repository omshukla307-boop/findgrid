import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Wallet, ShieldCheck, UserCheck, AlertTriangle, 
  CheckCircle2, ArrowRight, Lock, KeyRound, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAddress } from '../services/crypto';

export const LoginPage: React.FC = () => {
  const { 
    user, walletAddress, chainId, networkName, isAuthenticated, 
    isConnecting, isMetaMaskInstalled, connectAndSignWithMetaMask, 
    loginAsDemoRole, logout 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleMetaMaskAuth = async () => {
    try {
      setErrorMsg(null);
      await connectAndSignWithMetaMask();
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'MetaMask signature authentication failed.');
    }
  };

  const handleDemoAuth = async (role: 'admin' | 'investigator' | 'volunteer') => {
    try {
      setErrorMsg(null);
      await loginAsDemoRole(role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo authentication failed.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-900 border border-cyan-500/40 glow-cyan mb-4">
            <Lock className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Incident Command Access
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Cryptographic authentication using MetaMask wallet signature (EIP-191) with zero seed phrase exposure.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Authentication Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Authenticated State Card */}
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
                <span className="text-white">{user?.full_name || 'Field Officer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wallet:</span>
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
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5 transition-all"
              >
                Proceed to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-rose-300 border border-navy-700 transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          /* Primary MetaMask Wallet Authentication */
          <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl mb-6 glow-border">
            
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white">MetaMask Challenge Sign-In</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                PRODUCTION AUTH
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Cryptographic Nonce Challenge</span>
                  Backend generates a 256-bit single-use challenge nonce with a 10-minute validity window to prevent replay attacks.
                </div>
              </div>

              {isMetaMaskInstalled ? (
                <div className="p-3 bg-navy-950 rounded-xl border border-navy-800 text-xs font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">MetaMask Extension:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
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
                  <span>MetaMask browser extension not detected. You can test immediately using the 1-Click Demo Profiles below.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleMetaMaskAuth}
              disabled={isConnecting}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {isConnecting ? 'Verifying Challenge Signature...' : 'Sign In with MetaMask'}
            </button>
          </div>
        )}

        {/* Development Demo Login Section */}
        <div className="p-6 rounded-2xl bg-navy-900/60 border border-navy-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Hackathon Evaluation Demo Profiles
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Evaluate role-based permissions instantly with pre-seeded test accounts without requiring MetaMask signatures:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Demo Investigator */}
            <button
              onClick={() => handleDemoAuth('investigator')}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-cyan-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">Investigator</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded">Lead</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Det. Marcus Reed</span>
              <span className="text-[10px] text-slate-500 font-mono block">0x7099...79c8</span>
            </button>

            {/* Demo Administrator */}
            <button
              onClick={() => handleDemoAuth('admin')}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-purple-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-purple-300">Admin</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-purple-950 text-purple-400 rounded">Full</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Elena Vance</span>
              <span className="text-[10px] text-slate-500 font-mono block">0xf39f...2266</span>
            </button>

            {/* Demo Volunteer */}
            <button
              onClick={() => handleDemoAuth('volunteer')}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">Volunteer</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded">Field</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Alex Martinez</span>
              <span className="text-[10px] text-slate-500 font-mono block">0x90f7...b906</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
