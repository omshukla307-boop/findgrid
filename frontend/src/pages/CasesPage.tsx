import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Radio, Search, Filter, Plus, ArrowRight, MapPin, 
  Clock, ShieldAlert, User, Check, X, RefreshCw, LayoutGrid, List
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MissingPersonCase, CaseStatus, CaseUrgency } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { formatAddress } from '../services/crypto';

export const CasesPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Create Case Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: '',
    missing_person_name: '',
    age: 25,
    gender: 'Female',
    description: '',
    clothing_description: '',
    identifying_features: '',
    last_seen_time: new Date().toISOString().substring(0, 16),
    last_seen_location_name: '',
    last_seen_lat: 37.7749,
    last_seen_lng: -122.4194,
    urgency: 'High' as CaseUrgency,
    reporter_name: '',
    reporter_contact: '',
    reporter_relationship: '',
    is_sensitive: false,
    primary_image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  });

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await api.getCases({
        q: searchQuery || undefined,
        status: statusFilter || undefined,
        urgency: urgencyFilter || undefined,
      });
      setCases(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch cases.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, urgencyFilter]);

  // Auto-populate reporter details if user is logged in
  useEffect(() => {
    if (user?.full_name && !formData.reporter_name) {
      setFormData((prev) => ({
        ...prev,
        reporter_name: user.full_name,
        reporter_contact: prev.reporter_contact || user.email || '',
      }));
    }
  }, [user]);

  // Check URL query action=create
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setCreateModalOpen(true);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.missing_person_name || !formData.description) {
      showToast('Please fill in required case title, subject name, and description.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const newCase = await api.createCase({
        ...formData,
        last_seen_time: new Date(formData.last_seen_time).toISOString(),
      });
      showToast(`Case ${newCase.case_number} created successfully!`, 'success');
      setCreateModalOpen(false);
      fetchCases();
    } catch (err: any) {
      showToast(err.message || 'Failed to create case.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400" /> MISSING PERSON REPORTS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active missing person incident files and coordination perimeters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white shadow-md shadow-cyan-950 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> File Missing Person Complaint
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-navy-900 rounded-lg border border-navy-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-navy-800 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-navy-800 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 mb-6 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by case #, name, description, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </form>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="Active Search">Active Search</option>
            <option value="Under Review">Under Review</option>
            <option value="Potential Match">Potential Match</option>
            <option value="Resolved">Resolved</option>
            <option value="Submitted">Submitted</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Urgencies</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            onClick={() => { setSearchQuery(''); setStatusFilter(''); setUrgencyFilter(''); }}
            className="p-2 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 text-slate-400 hover:text-white text-xs"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Case List Content */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-slate-400">Loading case records...</span>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-navy-900 border border-navy-800">
          <Radio className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Matching Cases Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or clear the filters to view all active reports.
          </p>
          {(role === 'investigator' || role === 'admin') && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Open New Case Report
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Header: Case # & Badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 block mb-0.5">
                      {c.case_number}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {c.missing_person_name}
                    </h3>
                  </div>
                  <UrgencyBadge urgency={c.urgency} />
                </div>

                {/* Subtitle / Details */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  {c.age && <span>{c.age} yrs</span>}
                  {c.gender && <span>• {c.gender}</span>}
                  <StatusBadge status={c.status} />
                </div>

                {/* Description snippet */}
                <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                  {c.description}
                </p>

                {/* Last Seen Meta */}
                <div className="space-y-1.5 p-3 rounded-xl bg-navy-950 border border-navy-850 text-[11px] font-mono text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{c.last_seen_location_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{new Date(c.last_seen_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-navy-850 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  Lead: {formatAddress(c.assigned_investigator_wallet || '', 3)}
                </span>
                <Link
                  to={`/cases/${c.id}`}
                  className="font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-xs"
                >
                  View Dossier <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Clean Table View */
        <div className="rounded-2xl bg-navy-900 border border-navy-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-navy-800">
              <tr>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Seen Location</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-850">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-navy-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{c.case_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {c.missing_person_name} ({c.age || 'N/A'})
                  </td>
                  <td className="py-3.5 px-4"><UrgencyBadge urgency={c.urgency} /></td>
                  <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3.5 px-4 truncate max-w-xs">{c.last_seen_location_name}</td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(c.last_seen_time).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/cases/${c.id}`}
                      className="font-semibold text-cyan-400 hover:underline"
                    >
                      Dossier &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Case Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-6">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-base font-bold text-white font-mono">FILE MISSING PERSON COMPLAINT / REPORT</h2>
                  <p className="text-[11px] text-slate-400">Citizen intake file with rapid dispatch to search grid.</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Case Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Disappearance near Botanical Gardens"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Missing Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={formData.missing_person_name}
                    onChange={(e) => setFormData({ ...formData, missing_person_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Urgency Level</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as CaseUrgency })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical (Immediate Danger / Amber Alert)</option>
                    <option value="High">High (Silver Alert / High Risk)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last Seen Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.last_seen_time}
                    onChange={(e) => setFormData({ ...formData, last_seen_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Height, build, hair color, eye color, facial characteristics..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Clothing & Accessories</label>
                  <input
                    type="text"
                    placeholder="e.g. Olive green windbreaker, black leggings, white sneakers"
                    value={formData.clothing_description}
                    onChange={(e) => setFormData({ ...formData, clothing_description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Identifying Features</label>
                  <input
                    type="text"
                    placeholder="Scars, tattoos, eyeglasses, jewelry..."
                    value={formData.identifying_features}
                    onChange={(e) => setFormData({ ...formData, identifying_features: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Reporter Contact Information (For Citizen filing) */}
              <div className="p-3.5 bg-navy-950/70 rounded-xl border border-navy-800 space-y-3">
                <div className="text-xs font-semibold text-cyan-300">
                  Citizen / Complainant Contact Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sujal Das"
                      value={formData.reporter_name}
                      onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone / Email</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 555-0199 or email"
                      value={formData.reporter_contact}
                      onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Relationship to Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Parent, Sibling, Friend"
                      value={formData.reporter_relationship}
                      onChange={(e) => setFormData({ ...formData, reporter_relationship: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Last Seen Location with GPS helper */}
              <div className="p-3.5 bg-navy-950/70 rounded-xl border border-navy-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Last Seen Location & Coordinates</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setFormData((prev) => ({
                              ...prev,
                              last_seen_lat: parseFloat(pos.coords.latitude.toFixed(5)),
                              last_seen_lng: parseFloat(pos.coords.longitude.toFixed(5)),
                            }));
                            showToast('Captured your current GPS coordinates!', 'info');
                          },
                          (err) => {
                            showToast('GPS error: ' + err.message, 'error');
                          }
                        );
                      } else {
                        showToast('Geolocation is not supported by your browser.', 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-cyan-400" /> Use My Current GPS Location
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Location Name / Landmark *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Botanical Gardens Gate"
                      value={formData.last_seen_location_name}
                      onChange={(e) => setFormData({ ...formData, last_seen_location_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.last_seen_lat}
                      onChange={(e) => setFormData({ ...formData, last_seen_lat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.last_seen_lng}
                      onChange={(e) => setFormData({ ...formData, last_seen_lng: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_sensitive"
                  checked={formData.is_sensitive}
                  onChange={(e) => setFormData({ ...formData, is_sensitive: e.target.checked })}
                  className="rounded bg-navy-950 border-navy-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="is_sensitive" className="text-xs text-slate-300">
                  Classify as Protected Sensitive Case (Restricted to Authorized Investigators)
                </label>
              </div>

              <div className="pt-4 border-t border-navy-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-950 hover:bg-navy-850 text-slate-300 border border-navy-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-950"
                >
                  {submitting ? 'Registering Complaint...' : 'Submit Missing Person Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
