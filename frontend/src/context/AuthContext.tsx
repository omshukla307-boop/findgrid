import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  walletAddress: string | null;
  chainId: number | null;
  networkName: string;
  isAuthenticated: boolean;
  isConnecting: boolean;
  isMetaMaskInstalled: boolean;
  connectAndSignWithMetaMask: () => Promise<void>;
  loginAsDemoRole: (role: 'admin' | 'investigator' | 'volunteer') => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerCitizen: (data: { full_name: string; email: string; password: string; organization?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>('Not Connected');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const { showToast } = useToast();

  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);

  const getNetworkName = (id: number): string => {
    switch (id) {
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      case 31337: return 'Hardhat Local (31337)';
      case 1337: return 'Localhost (1337)';
      default: return `Chain ID: ${id}`;
    }
  };

  // Restore authenticated session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('findgrid_token');
    const savedWallet = localStorage.getItem('findgrid_wallet');

    if (token) {
      api.getCurrentUser()
        .then(profile => {
          setUser(profile);
          setWalletAddress(profile.wallet_address);
        })
        .catch(err => {
          console.warn('Session restoration failed:', err);
          localStorage.removeItem('findgrid_token');
          localStorage.removeItem('findgrid_wallet');
        });
    }

    // Check existing wallet connection
    if (isMetaMaskInstalled && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0].toLowerCase());
          }
        })
        .catch(console.error);

      window.ethereum.request({ method: 'eth_chainId' })
        .then((chainHex: string) => {
          const id = parseInt(chainHex, 16);
          setChainId(id);
          setNetworkName(getNetworkName(id));
        })
        .catch(console.error);

      // Event listeners
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          logout();
        } else {
          setWalletAddress(accounts[0].toLowerCase());
        }
      };

      const handleChainChanged = (chainHex: string) => {
        const id = parseInt(chainHex, 16);
        setChainId(id);
        setNetworkName(getNetworkName(id));
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, [isMetaMaskInstalled]);

  // MetaMask Authentication: Challenge Nonce -> Sign Message -> Verify on Backend
  const connectAndSignWithMetaMask = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      showToast('MetaMask is not detected. Please install MetaMask browser extension or use Demo Login.', 'error');
      return;
    }

    try {
      setIsConnecting(true);

      // 1. Request wallet connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts authorized in MetaMask.');
      }
      const activeAddress = accounts[0].toLowerCase();
      setWalletAddress(activeAddress);

      // Get network info
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      setNetworkName(getNetworkName(currentChainId));

      // 2. Request single-use challenge nonce from FastAPI backend
      showToast('Requesting cryptographic authentication nonce...', 'info');
      const nonceData = await api.getNonce(activeAddress);

      // 3. Prompt MetaMask to sign the personal challenge (EIP-191)
      showToast('Please sign the authentication challenge in your MetaMask wallet...', 'info');
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonceData.message);

      // 4. Verify signature on backend & obtain JWT session
      showToast('Verifying cryptographic signature on backend...', 'info');
      const authResult = await api.verifySignature(activeAddress, signature, nonceData.nonce);

      localStorage.setItem('findgrid_token', authResult.access_token);
      localStorage.setItem('findgrid_wallet', authResult.wallet_address);

      setUser(authResult.profile);
      showToast(`Welcome! Authenticated as ${authResult.profile.role.toUpperCase()} (${authResult.wallet_address.substring(0, 6)}...${authResult.wallet_address.substring(38)})`, 'success');
    } catch (err: any) {
      console.error('MetaMask sign-in failed:', err);
      showToast(err.message || 'MetaMask sign-in failed. Please try again.', 'error');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, showToast]);

  // Hackathon Evaluation Demo Login
  const loginAsDemoRole = useCallback(async (demoRole: 'admin' | 'investigator' | 'volunteer') => {
    try {
      setIsConnecting(true);
      const authResult = await api.demoLogin(demoRole);

      localStorage.setItem('findgrid_token', authResult.access_token);
      localStorage.setItem('findgrid_wallet', authResult.wallet_address);

      setUser(authResult.profile);
      setWalletAddress(authResult.wallet_address);
      showToast(`Demo Mode: Logged in as ${authResult.profile.role.toUpperCase()} (${authResult.profile.full_name || authResult.wallet_address})`, 'success');
    } catch (err: any) {
      console.error('Demo login failed:', err);
      showToast(err.message || 'Demo login failed.', 'error');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [showToast]);

  // Citizen & Community Email Authentication
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setIsConnecting(true);
      const authResult = await api.loginWithEmail(email, password);

      localStorage.setItem('findgrid_token', authResult.access_token);
      localStorage.setItem('findgrid_wallet', authResult.wallet_address);

      setUser(authResult.profile);
      setWalletAddress(authResult.wallet_address);
      showToast(`Welcome back, ${authResult.profile.full_name || authResult.profile.email}!`, 'success');
    } catch (err: any) {
      console.error('Email sign in failed:', err);
      showToast(err.message || 'Email sign in failed.', 'error');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [showToast]);

  // Citizen & Community Registration
  const registerCitizen = useCallback(async (data: { full_name: string; email: string; password: string; organization?: string }) => {
    try {
      setIsConnecting(true);
      const authResult = await api.registerCitizen(data);

      localStorage.setItem('findgrid_token', authResult.access_token);
      localStorage.setItem('findgrid_wallet', authResult.wallet_address);

      setUser(authResult.profile);
      setWalletAddress(authResult.wallet_address);
      showToast(`Account registered successfully! Welcome to FindGrid, ${authResult.profile.full_name}.`, 'success');
    } catch (err: any) {
      console.error('Citizen registration failed:', err);
      showToast(err.message || 'Citizen registration failed.', 'error');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [showToast]);

  const logout = useCallback(() => {
    localStorage.removeItem('findgrid_token');
    localStorage.removeItem('findgrid_wallet');
    setUser(null);
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  const role: UserRole = user?.role || 'public';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        walletAddress,
        chainId,
        networkName,
        isAuthenticated,
        isConnecting,
        isMetaMaskInstalled,
        connectAndSignWithMetaMask,
        loginAsDemoRole,
        loginWithEmail,
        registerCitizen,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
