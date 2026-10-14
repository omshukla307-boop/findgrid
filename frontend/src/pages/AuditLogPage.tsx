import React, { useEffect, useState } from 'react';
import { 
  History, Search, Filter, Blocks, User, 
  Clock, ShieldAlert, CheckCircle2, RefreshCw, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { AuditEvent } from '../types';
import { formatAddress, formatHash } from '../services/crypto';

export const AuditLogPage: React.FC = () => {
  const { showToast } = useToast();
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditEvents({
        action_type: actionFilter || undefined,
        actor_wallet: searchQuery || undefined,
      });
      setAudits(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAudits();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" /> SYSTEM AUDIT TRAIL
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident chronological log of case creations, status shifts, and blockchain transaction receipts.
          </p>
        </div>

        <button
          onClick={fetchAudits}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-navy-900 hover:bg-navy-850 border border-navy-700 text-slate-300 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Refresh Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 mb-6 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Filter by actor wallet address (0x...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="CASE_CREATED">CASE_CREATED</option>
            <option value="STATUS_CHANGED">STATUS_CHANGED</option>
            <option value="EVIDENCE_SECURED_OFFCHAIN">EVIDENCE_SECURED_OFFCHAIN</option>
            <option value="EVIDENCE_REGISTERED_ON_CHAIN">EVIDENCE_REGISTERED_ON_CHAIN</option>
            <option value="AI_MATCH_CONFIRMED">AI_MATCH_CONFIRMED</option>
            <option value="AI_MATCH_REJECTED">AI_MATCH_REJECTED</option>
            <option value="USER_AUTHENTICATED_METAMASK">USER_AUTHENTICATED_METAMASK</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading immutable audit logs...
          </div>
        ) : audits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No audit records matching filter criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-navy-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Actor Wallet</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Blockchain TX Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-850">
              {audits.map((a) => (
                <tr key={a.id} className="hover:bg-navy-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-navy-950 text-cyan-300 border border-cyan-500/30">
                      {a.action_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {formatAddress(a.actor_wallet, 4)}
                  </td>
                  <td className="py-3.5 px-4 max-w-md truncate text-slate-400 text-[11px]">
                    {typeof a.details === 'object' ? JSON.stringify(a.details) : a.details}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                    {a.on_chain_tx_hash ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Blocks className="w-3.5 h-3.5" /> {formatHash(a.on_chain_tx_hash, 4)}
                      </span>
                    ) : (
                      <span className="text-slate-500">Internal Audit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
