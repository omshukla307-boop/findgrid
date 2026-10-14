import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, Clock, AlertCircle, Plus, 
  MapPin, Shield, Check, RefreshCw, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SearchTask, UserProfile, VolunteerAssignment, TaskStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatAddress } from '../services/crypto';

export const VolunteerCoordinationPage: React.FC = () => {
  const { user, role, walletAddress } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Assign volunteer modal
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<SearchTask | null>(null);
  const [targetVolunteerWallet, setTargetVolunteerWallet] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  const fetchVolunteerData = async () => {
    try {
      setLoading(true);
      const [tList, vList] = await Promise.all([
        api.getTasks(),
        api.getVolunteers('volunteer'),
      ]);
      setTasks(tList);
      setVolunteers(vList);
      if (vList.length > 0) {
        setTargetVolunteerWallet(vList[0].wallet_address);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load volunteer coordination data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteerData();
  }, []);

  const handleAssignVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !targetVolunteerWallet) return;

    try {
      setAssigning(true);
      await api.assignVolunteer(selectedTask.id, targetVolunteerWallet, assignNotes);
      showToast('Volunteer successfully assigned to search task!', 'success');
      setAssignModalOpen(false);
      setAssignNotes('');
      fetchVolunteerData();
    } catch (err: any) {
      showToast(err.message || 'Assignment failed.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      showToast(`Task status updated to ${newStatus}.`, 'success');
      fetchVolunteerData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task status.', 'error');
    }
  };

  const isInvestigator = role === 'investigator' || role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" /> VOLUNTEER SEARCH OPERATIONS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tactical grid task management, field crew assignments, and search sector progress.
          </p>
        </div>

        <button
          onClick={fetchVolunteerData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-navy-900 hover:bg-navy-850 border border-navy-700 text-slate-300 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Refresh Roster
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Active Search Tasks Board (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              OPERATIONAL SEARCH TASKS ({tasks.length})
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              Active sectors deployed
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading operational tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-navy-900 border border-navy-800 text-slate-400 text-xs">
              No active search tasks deployed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-cyan-400">{task.zone_name}</span>
                        <StatusBadge status={task.status} />
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                            : 'bg-navy-950 text-slate-300 border-navy-800'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{task.title}</h3>
                    </div>

                    {isInvestigator && (
                      <button
                        onClick={() => { setSelectedTask(task); setAssignModalOpen(true); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow"
                      >
                        Assign Crew
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{task.description}</p>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 p-2.5 rounded-xl bg-navy-950 border border-navy-850">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Radius: {task.zone_radius_meters}m</span>
                    </div>
                    <span>•</span>
                    <div>Coordinator: {formatAddress(task.created_by, 4)}</div>
                  </div>

                  {/* Assigned Volunteers Roster */}
                  {task.assignments && task.assignments.length > 0 && (
                    <div className="pt-3 border-t border-navy-850">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                        Assigned Volunteers:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {task.assignments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs font-mono"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-200">{formatAddress(a.volunteer_wallet, 3)}</span>
                            <span className="text-[10px] text-cyan-400">({a.status})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Volunteer Quick Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                    {task.status !== 'In Progress' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                        className="px-2.5 py-1 rounded bg-navy-950 hover:bg-navy-800 text-cyan-300 border border-cyan-500/30 text-[11px]"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {task.status !== 'Completed' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}
                        className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px]"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Registered Volunteers Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" /> ACTIVE VOLUNTEER ROSTER
            </h2>

            <div className="space-y-3">
              {volunteers.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-navy-950 border border-navy-850 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{v.full_name || 'Volunteer Officer'}</span>
                    <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 bg-navy-900 rounded border border-navy-800">
                      {v.badge_number || 'VOL-GRID'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{v.organization || 'Community Patrol'}</div>
                  <div className="text-[10px] font-mono text-slate-500">{formatAddress(v.wallet_address, 4)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Assign Volunteer Modal */}
      {assignModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">
              ASSIGN CREW TO TASK
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedTask.title}</p>

            <form onSubmit={handleAssignVolunteer} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Volunteer</label>
                <select
                  value={targetVolunteerWallet}
                  onChange={(e) => setTargetVolunteerWallet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white"
                >
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.wallet_address}>
                      {v.full_name} ({v.badge_number || formatAddress(v.wallet_address, 3)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mission Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring thermal imaging or high-output flashlights. Meet at Sector Gate 2."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs bg-navy-950 text-slate-300 border border-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
