import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, Radio, Users, MapPin, Eye, BrainCircuit,
  FileCheck2, History, Settings, Menu, X, LogOut,
  Wallet, Info, Lock, QrCode, Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAddress } from '../services/crypto';
import { CitizenQRScannerModal } from './CitizenQRScannerModal';

export const Navbar: React.FC = () => {
  const { 
    user, role, walletAddress, networkName, isAuthenticated,
    connectAndSignWithMetaMask, logout, isConnecting 
  } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Shield },
    { to: '/cases', label: 'Cases', icon: Radio },
    { to: '/sightings', label: 'Sightings', icon: Eye },
    { to: '/ai-matching', label: 'AI Match', icon: BrainCircuit },
    { to: '/map', label: 'Search Map', icon: MapPin },
    { to: '/volunteers', label: 'Volunteers', icon: Users },
    { to: '/blockchain', label: 'Evidence Registry', icon: FileCheck2 },
    { to: '/audit', label: 'Audit Trail', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-md border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-navy-900 border border-cyan-500/40 glow-cyan">
              <Radio className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-white font-mono">FIND<span className="text-cyan-400">GRID</span></span>
                <span className="px-1.5 py-0.2 bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-mono">v1.0</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">AI SEARCH & BLOCKCHAIN INTEGRITY</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated ? (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-navy-850 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-navy-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="hidden lg:flex items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900 border border-navy-800 text-slate-400 font-mono">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>SIGN IN REQUIRED FOR TACTICAL OPERATIONS</span>
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-navy-900 border border-navy-800 transition-colors"
              >
                <Info className="w-3 h-3 text-cyan-400" />
                <span>Overview</span>
              </Link>
            </div>
          )}

          {/* Auth & Wallet Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Network & Role indicators */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {role === 'volunteer' ? 'Sujal Das' : (user?.full_name || formatAddress(walletAddress || user?.wallet_address || '', 4))}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {role === 'volunteer' ? 'Sujal Das' : role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {role === 'volunteer' ? `Active Volunteer • ${networkName}` : networkName}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Disconnect and sign out"
                  className="p-2 rounded-lg bg-navy-900 hover:bg-navy-850 text-slate-400 hover:text-rose-400 border border-navy-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQRScannerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shadow-sm shadow-emerald-950/50"
                  title="Scan Citizen QR Identity and Verify Face"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Citizen QR ID</span>
                </button>
                <button
                  onClick={connectAndSignWithMetaMask}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-950 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {isConnecting ? 'Verifying...' : 'Admin (MetaMask)'}
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-navy-900 text-slate-300 hover:text-white border border-navy-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950 border-b border-navy-800 px-4 pt-2 pb-4 space-y-1">
          {isAuthenticated ? (
            <>
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-navy-850 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-navy-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-navy-800 flex flex-col gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-navy-900 border border-navy-800">
                  <div>
                    <div className="text-xs font-mono text-cyan-300">{formatAddress(walletAddress || '', 5)}</div>
                    <div className="text-[10px] text-slate-400">Role: {role === 'volunteer' ? 'SUJAL DAS (VOLUNTEER)' : role.toUpperCase()}</div>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="px-2.5 py-1 text-xs text-rose-300 bg-rose-950/60 rounded border border-rose-500/30 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 space-y-3">
              <div className="text-xs text-slate-400 font-mono text-center p-2 rounded bg-navy-900 border border-navy-800">
                Sign in with MetaMask or scan Citizen Identity to enter FindGrid.
              </div>
              <button
                type="button"
                onClick={() => { setIsQRScannerOpen(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 rounded-lg shadow-md transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <Camera className="w-4 h-4 text-cyan-400" />
                Citizen QR & Face ID Scanner
              </button>
              <button
                type="button"
                onClick={() => { connectAndSignWithMetaMask(); setMobileMenuOpen(false); }}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg shadow-md transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Admin (MetaMask)
              </button>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-300 hover:text-white bg-navy-900 rounded-lg border border-navy-800"
              >
                <Info className="w-4 h-4 text-cyan-400" />
                Platform Overview
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Citizen QR Code Scanner & Biometric Face Verification Modal */}
      <CitizenQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </header>
  );
};
