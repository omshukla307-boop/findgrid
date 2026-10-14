import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Radio, BrainCircuit, Blocks, Users, Eye, 
  AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, 
  TrendingUp, Clock, FileCheck2, PlusCircle, Activity, MapPin
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AnalyticsOverview } from '../types';
import { formatAddress, formatHash } from '../services/crypto';

export const DashboardPage: React.FC = () => {
  const { user, role, walletAddress } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Format urgency chart data
  const urgencyChartData = analytics ? [
    { name: 'Critical', count: analytics.urgency_distribution.Critical || 0, fill: '#f43f5e' },
    { name: 'High', count: analytics.urgency_distribution.High || 0, fill: '#f59e0b' },
    { name: 'Medium', count: analytics.urgency_distribution.Medium || 0, fill: '#06b6d4' },
    { name: 'Low', count: analytics.urgency_distribution.Low || 0, fill: '#64748b' },
  ] : [];

  // Format status chart data
  const statusChartData = analytics ? Object.entries(analytics.status_distribution).map(([name, value]) => ({
    name,
    value,
  })).filter(item => item.value > 0) : [];

  const STATUS_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-navy-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              OPERATIONAL <span className="text-cyan-400">COMMAND</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-850 text-cyan-300 border border-cyan-500/30">
              {role.toUpperCase()} CLEARANCE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Authenticated Officer: <span className="text-slate-200 font-semibold">{user?.full_name || 'Anonymous User'}</span> ({formatAddress(walletAddress || '', 4)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-navy-900 hover:bg-navy-850 border border-navy-700 text-slate-300 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Telemetry
          </button>

          <Link
            to="/cases?action=create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-md shadow-cyan-950 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" /> File Missing Complaint
          </Link>

          <Link
            to="/sightings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Report Last Location
          </Link>
        </div>
      </div>

      {/* Primary Citizen & Community Action Gateway */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Action 1: File a Missing Person Complaint */}
        <Link
          to="/cases?action=create"
          className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 border border-cyan-500/40 hover:border-cyan-400 shadow-xl transition-all group flex items-start justify-between cursor-pointer"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              CITIZEN INTAKE
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              File Missing Person Complaint
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Report a missing family member, child, or acquaintance. Dispatches emergency broadcast to volunteer search grid and engages AI facial & spatiotemporal matching.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform pt-1">
              <span>Open Complaint Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
        </Link>

        {/* Action 2: Report Sighting / Last Known Location */}
        <Link
          to="/sightings"
          className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 border border-emerald-500/40 hover:border-emerald-400 shadow-xl transition-all group flex items-start justify-between cursor-pointer"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
              <Eye className="w-3 h-3 text-emerald-400" />
              SIGHTING & LAST LOCATION
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              Report Sighting / Last Seen Location
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Have you seen a missing individual? Submit the exact location, timestamp, and visual observations. Coordinates are instantly mapped and correlated by the AI engine.
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform pt-1">
              <span>Submit Sighting & Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Primary KPI Grid (8 metrics computed from DB records) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Cases</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.total_active_cases ?? 0}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Search perimeters engaged</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {analytics?.cases_awaiting_review ?? 0}
          </div>
          <span className="text-[10px] text-amber-400 font-mono mt-1 block">Requires intake triage</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Sightings Reported</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {analytics?.total_sightings ?? 0}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">{analytics?.sightings_under_review ?? 0} in review queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">AI Match Flags</span>
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {analytics?.potential_matches_pending ?? 0}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Awaiting human sign-off</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Cases Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {analytics?.cases_resolved ?? 0}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Safe returns recorded</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Search Tasks</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {analytics?.tasks_in_progress ?? 0}
          </div>
          <span className="text-[10px] text-purple-400 font-mono mt-1 block">Active sector sweeps</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Secured Evidence</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.total_evidence_files ?? 0}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Off-chain SHA-256</span>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">On-Chain Verified</span>
            <Blocks className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {analytics?.blockchain_verified_count ?? 0}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono mt-1 block">Registry receipts</span>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Case Urgency Breakdown (Bar Chart) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Urgency Distribution
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Database Records</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1329',
                    borderColor: '#1d2e5c',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution (Pie Chart) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Case Status Breakdown
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Operational Lifecycle</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1329',
                      borderColor: '#1d2e5c',
                      borderRadius: '0.75rem',
                      color: '#f1f5f9',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 font-mono">No status records</span>
            )}
          </div>
        </div>

      </div>

      {/* Recent Audit & System Events Feed */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
        <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-cyan-400" /> AUDIT TELEMETRY & BLOCKCHAIN RECEIPTS
          </h3>
          <Link to="/audit" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono">
            Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-navy-850">
          {analytics?.recent_activity && analytics.recent_activity.length > 0 ? (
            analytics.recent_activity.slice(0, 5).map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-navy-950 text-cyan-300 border border-cyan-500/30 shrink-0">
                    {act.action}
                  </span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    Actor: {formatAddress(act.actor, 4)}
                  </span>
                  <span className="text-slate-400 truncate max-w-xs text-[11px]">
                    {typeof act.details === 'object' ? JSON.stringify(act.details) : act.details}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[10px]">
                  {act.tx_hash && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Blocks className="w-3 h-3" /> TX: {formatHash(act.tx_hash, 3)}
                    </span>
                  )}
                  <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center font-mono">No recent audit events.</p>
          )}
        </div>
      </div>

    </div>
  );
};
