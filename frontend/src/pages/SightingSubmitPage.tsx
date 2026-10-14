import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Eye, MapPin, Clock, Send, ShieldCheck, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Sparkles, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sighting, MissingPersonCase, SightingStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatAddress } from '../services/crypto';

export const SightingSubmitPage: React.FC = () => {
  const { user, role, walletAddress } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'submit' | 'queue'>('submit');
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Sighting Form Data
  const [formData, setFormData] = useState({
    case_id: searchParams.get('case_id') || '',
    location_name: '',
    latitude: 37.7812,
    longitude: -122.4101,
    sighting_time: new Date().toISOString().substring(0, 16),
    description: '',
    clothing_observed: '',
    reporter_name: user?.full_name || '',
    reporter_contact: user?.email || '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Auto-fill reporter details when user logs in
  useEffect(() => {
    if (user?.full_name && !formData.reporter_name) {
      setFormData((prev) => ({
        ...prev,
        reporter_name: user.full_name,
        reporter_contact: prev.reporter_contact || user.email || '',
      }));
    }
  }, [user]);

  // Review modal
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  const fetchCasesAndSightings = async () => {
    try {
      setLoading(true);
      const [casesData, sightingsData] = await Promise.all([
        api.getCases(),
        api.getSightings({ status: statusFilter || undefined }),
      ]);
      setCases(casesData);
      setSightings(sightingsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load sightings data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesAndSightings();
  }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location_name || !formData.description) {
      showToast('Please provide location name and observation description.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        case_id: formData.case_id || undefined,
        sighting_time: new Date(formData.sighting_time).toISOString(),
      };

      const result = await api.submitSighting(payload);
      showToast('Sighting submitted successfully! Automated AI matching engaged.', 'success');

      // Clear form
      setFormData({
        case_id: '',
        location_name: '',
        latitude: 37.7812,
        longitude: -122.4101,
        sighting_time: new Date().toISOString().substring(0, 16),
        description: '',
        clothing_observed: '',
        reporter_name: user?.full_name || '',
        reporter_contact: user?.email || '',
      });

      fetchCasesAndSightings();
      setActiveTab('queue');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit sighting.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: SightingStatus) => {
    if (!selectedSighting) return;
    try {
      setReviewing(true);
      await api.updateSighting(selectedSighting.id, {
        status,
        investigator_notes: reviewNotes,
      });
      showToast(`Sighting status updated to ${status}.`, 'success');
      setSelectedSighting(null);
      setReviewNotes('');
      fetchCasesAndSightings();
    } catch (err: any) {
      showToast(err.message || 'Failed to update sighting status.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const isInvestigator = role === 'investigator' || role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-navy-800">
        <div>
          <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <Eye className="w-6 h-6 text-cyan-400" /> CROWDSOURCED SIGHTINGS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Community reporting and investigative verification queue with automatic AI proximity correlation.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-navy-900 rounded-xl border border-navy-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'submit' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Submit New Sighting
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'queue' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Review Queue ({sightings.length})
          </button>
        </div>
      </div>

      {activeTab === 'submit' ? (
        /* Submission Form */
        <div className="max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl glow-border">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-850">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  REPORT SIGHTING / LAST SEEN LOCATION
                </h2>
                <p className="text-[11px] text-slate-400">
                  Did you spot a missing person? Provide their last known location and timestamp to focus search operations.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correlate with Specific Case (Optional):
                </label>
                <select
                  value={formData.case_id}
                  onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">General / Unlinked Sighting (AI will auto-match across all cases)</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.missing_person_name} ({c.title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Location & GPS Coordinate Capture */}
              <div className="p-4 bg-navy-950/70 rounded-xl border border-navy-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Last Seen Location & Coordinates</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setFormData((prev) => ({
                              ...prev,
                              latitude: parseFloat(pos.coords.latitude.toFixed(5)),
                              longitude: parseFloat(pos.coords.longitude.toFixed(5)),
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400" /> Use My Current GPS Location
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Location / Landmark *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bayside Pier Boardwalk Cafe, Sector 4 Market"
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Date & Time of Sighting *</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.sighting_time}
                      onChange={(e) => setFormData({ ...formData, sighting_time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Description of Sighting *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe physical traits, demeanor, companion(s), actions, direction of movement..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clothing & Personal Items Observed</label>
                <input
                  type="text"
                  placeholder="e.g. Green windbreaker jacket, black athletic leggings, white sneakers"
                  value={formData.clothing_observed}
                  onChange={(e) => setFormData({ ...formData, clothing_observed: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name / Handle</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Martinez"
                    value={formData.reporter_name}
                    onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone / Email</label>
                  <input
                    type="text"
                    placeholder="e.g. 555-0188-721"
                    value={formData.reporter_contact}
                    onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-navy-800 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-md shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting & Evaluating AI Correlation...' : 'Submit Sighting & Last Seen Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Review Queue Tab */
        <div className="space-y-4">
          
          {/* Queue Filter */}
          <div className="flex items-center justify-between p-4 bg-navy-900 rounded-2xl border border-navy-800">
            <span className="text-xs font-mono text-slate-300">
              Showing {sightings.length} Submitted Sightings
            </span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Verification States</option>
              <option value="Submitted">Submitted (Unreviewed)</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified by Investigator</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {sightings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-navy-900 border border-navy-800">
              <Eye className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono">No sightings in queue matching filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sightings.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate">{s.location_name}</span>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{s.description}</p>

                    {s.clothing_observed && (
                      <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-850 text-[11px] text-cyan-300 font-mono">
                        Apparel: {s.clothing_observed}
                      </div>
                    )}

                    {s.investigator_notes && (
                      <div className="p-2.5 rounded-lg bg-navy-950 border border-cyan-500/20 text-[11px] text-slate-300">
                        <span className="font-semibold text-cyan-400 font-mono block mb-0.5">Investigator Note:</span>
                        {s.investigator_notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-navy-850 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div>
                      <span>Reporter: {s.reporter_name || formatAddress(s.reporter_wallet || '', 3)}</span>
                    </div>

                    {isInvestigator ? (
                      <button
                        onClick={() => { setSelectedSighting(s); setReviewNotes(s.investigator_notes || ''); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-navy-850 hover:bg-navy-800 text-cyan-300 border border-cyan-500/30"
                      >
                        Triage Sighting
                      </button>
                    ) : (
                      <span>{new Date(s.sighting_time).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Investigator Review Decision Modal */}
      {selectedSighting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">
              TRIAGE SIGHTING REPORT
            </h3>
            <p className="text-xs text-slate-400 mb-4">{selectedSighting.location_name}</p>

            <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 text-xs text-slate-300 mb-4 space-y-1">
              <div>{selectedSighting.description}</div>
              {selectedSighting.clothing_observed && (
                <div className="text-cyan-300 font-mono text-[11px]">Apparel: {selectedSighting.clothing_observed}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Investigator Triage Notes:</label>
              <textarea
                rows={3}
                placeholder="Enter notes on corroboration, photo evidence, witness contact, or rejection reasoning..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateStatus('Verified')}
                disabled={reviewing}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Verified
              </button>
              <button
                onClick={() => handleUpdateStatus('Rejected')}
                disabled={reviewing}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => setSelectedSighting(null)}
                className="py-2 px-3 rounded-xl text-xs bg-navy-950 text-slate-300 border border-navy-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
