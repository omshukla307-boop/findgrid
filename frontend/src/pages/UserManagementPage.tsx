import React, { useEffect, useState } from 'react';
import { 
  Users, ShieldCheck, UserCheck, Search, Filter, 
  RefreshCw, CheckCircle2, AlertTriangle, Edit3
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserProfile, UserRole } from '../types';
import { formatAddress } from '../services/crypto';

export const UserManagementPage: React.FC = () => {
  const { role: currentUserRole } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('volunteer');
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setUpdating(true);
      await api.updateUser(selectedUser.id, { role: targetRole });
      showToast(`Role for ${selectedUser.full_name || selectedUser.wallet_address} elevated to ${targetRole.toUpperCase()}.`, 'success');
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" /> USER & ROLE CLEARANCE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Role-based authorization and clearance directory for administrators, sworn investigators, and volunteers.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-navy-900 hover:bg-navy-850 border border-navy-700 text-slate-300 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Refresh Roster
        </button>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Loading personnel records...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            No registered profiles found.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-navy-800">
              <tr>
                <th className="py-3 px-4">Name / Officer</th>
                <th className="py-3 px-4">Wallet Address</th>
                <th className="py-3 px-4">Clearance Role</th>
                <th className="py-3 px-4">Organization & Badge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-850">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-navy-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {u.full_name || 'Anonymous User'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400">
                    {formatAddress(u.wallet_address, 4)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
                      u.role === 'admin'
                        ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                        : u.role === 'investigator'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    <div>{u.organization || 'Community Patrol'}</div>
                    <div className="font-mono text-[10px] text-slate-500">{u.badge_number || 'N/A'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isAdmin ? (
                      <button
                        onClick={() => { setSelectedUser(u); setTargetRole(u.role); }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-navy-950 hover:bg-navy-800 text-cyan-300 border border-navy-800"
                      >
                        Edit Role
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-mono">Read Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Role Modal (Admin Only) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">
              MODIFY USER ROLE CLEARANCE
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Officer: {selectedUser.full_name || selectedUser.wallet_address}
            </p>

            <form onSubmit={handleRoleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Role:</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white"
                >
                  <option value="volunteer">Volunteer (Field search & sighting submissions)</option>
                  <option value="investigator">Investigator (Case management, evidence hashing, AI triage)</option>
                  <option value="admin">Administrator (Full root authority & user management)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2 rounded-xl text-xs bg-navy-950 text-slate-300 border border-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {updating ? 'Updating...' : 'Save Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
