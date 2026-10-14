import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Wallet, ShieldCheck, UserCheck, AlertTriangle, 
  CheckCircle2, ArrowRight, Lock, KeyRound, Sparkles,
  Radio, Shield, BrainCircuit, FileCheck2, Info, Mail,
  User, Building2, UserPlus, LogIn, HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAddress } from '../services/crypto';

export const LoginPage: React.FC = () => {
  const { 
    user, walletAddress, chainId, networkName, isAuthenticated, 
    isConnecting, isMetaMaskInstalled, connectAndSignWithMetaMask, 
    loginAsDemoRole, loginWithEmail, registerCitizen, logout 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth method tab: 'citizen' (Email & Password) or 'metamask' (Web3 Cryptographic)
  const [activeTab, setActiveTab] = useState<'citizen' | 'metamask'>('citizen');
  
  // Citizen Form state
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }
    try {
      setErrorMsg(null);
      await loginWithEmail(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    }
  };

  const handleCitizenRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in your name, email, and a password (minimum 6 characters).');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    try {
      setErrorMsg(null);
      await registerCitizen({
        full_name: fullName,
        email,
        password,
        organization: organization || 'Community Volunteer',
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. This email may already be in use.');
    }
  };

  const handleQuickCitizenFill = async () => {
    setEmail('citizen@findgrid.org');
    setPassword('Password123!');
    try {
      setErrorMsg(null);
      await loginWithEmail('citizen@findgrid.org', 'Password123!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo citizen login failed.');
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

              {/* Tab 2: Web3 MetaMask */}
              <button
                onClick={() => { setActiveTab('metamask'); setErrorMsg(null); }}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'metamask'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-navy-850'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>MetaMask Web3</span>
              </button>

            </div>

            {/* TAB 1 CONTENT: Normal People / Citizen / Email Sign In & Sign Up */}
            {activeTab === 'citizen' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl glow-border">
                
                <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      {isRegisterMode ? 'Register as Community Volunteer' : 'Community & Citizen Sign In'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isRegisterMode 
                        ? 'Create a citizen responder account with standard email credentials.' 
                        : 'Sign in with your email address to report sightings and join searches.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 whitespace-nowrap hidden sm:inline-block">
                    NO CRYPTO REQUIRED
                  </span>
                </div>

                {/* Sub-toggle: Sign In vs Create Account */}
                <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-navy-950 rounded-xl border border-navy-800 text-xs">
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(false); setErrorMsg(null); }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      !isRegisterMode 
                        ? 'bg-navy-800 text-cyan-300 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    I already have an account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(true); setErrorMsg(null); }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      isRegisterMode 
                        ? 'bg-navy-800 text-cyan-300 shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    New Citizen / Volunteer
                  </button>
                </div>

                {/* Registration Form */}
                {isRegisterMode ? (
                  <form onSubmit={handleCitizenRegistration} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="sarah.jenkins@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Community Group / Organization <span className="text-slate-500">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          placeholder="e.g. Neighborhood Volunteer Alliance"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-[11px] text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>An EVM smart-contract address is automatically provisioned for your account behind the scenes.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      {isConnecting ? 'Registering Account...' : 'Create Citizen Account'}
                    </button>
                  </form>
                ) : (
                  /* Standard Sign In Form */
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isConnecting}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      {isConnecting ? 'Authenticating...' : 'Sign In as Citizen / Volunteer'}
                    </button>

                    {/* Quick 1-Click Citizen Test Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleQuickCitizenFill}
                        disabled={isConnecting}
                        className="w-full py-2.5 px-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>1-Click Test Citizen: citizen@findgrid.org</span>
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}

            {/* TAB 2 CONTENT: Web3 MetaMask Cryptographic Sign In */}
            {activeTab === 'metamask' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl glow-border">
                
                <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-6">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-bold text-white">MetaMask Challenge Sign-In</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    EIP-191 SIGNATURE
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-xs text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block mb-0.5">Cryptographic Nonce Challenge</span>
                      Backend generates a single-use 256-bit challenge nonce with a 10-minute validity window to prevent replay attacks. Zero private key exposure.
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
                  {isConnecting ? 'Verifying Challenge Signature...' : 'Sign In with MetaMask'}
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

            {/* Demo Volunteer */}
            <button
              onClick={() => handleDemoMetaMaskAuth('volunteer')}
              disabled={isConnecting}
              className="p-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300">Citizen / Vol.</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded">Citizen</span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Sarah Jenkins</span>
              <span className="text-[10px] text-slate-500 font-mono block">citizen@findgrid...</span>
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

      </div>
    </div>
  );
};
