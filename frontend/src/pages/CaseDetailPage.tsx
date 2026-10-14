import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Radio, MapPin, Clock, ShieldCheck, 
  FileCheck2, Eye, History, Upload, Blocks, CheckCircle2, 
  AlertTriangle, Copy, ExternalLink, RefreshCw, Plus
} from 'lucide-react';
import { api } from '../services/api';
import { contractService } from '../services/contractService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MissingPersonCase, EvidenceRecord, Sighting, CaseStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { formatAddress, formatHash } from '../services/crypto';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role, walletAddress } = useAuth();
  const { showToast } = useToast();

  const [caseData, setCaseData] = useState<MissingPersonCase | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dossier' | 'evidence' | 'sightings' | 'timeline'>('dossier');
  const [loading, setLoading] = useState<boolean>(true);

  // Status update
  const [newStatus, setNewStatus] = useState<CaseStatus>('Active Search');
  const [statusReason, setStatusReason] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // Evidence upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [registeringHashId, setRegisteringHashId] = useState<string | null>(null);

  const fetchCaseDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [c, ev, si, tl] = await Promise.all([
        api.getCase(id),
        api.getEvidence(id),
        api.getSightings({ case_id: id }),
        api.getCaseTimeline(id),
      ]);
      setCaseData(c);
      setNewStatus(c.status);
      setEvidenceList(ev);
      setSightings(si);
      setTimeline(tl);
    } catch (err: any) {
      showToast(err.message || 'Failed to load case details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !caseData) return;

    try {
      setUpdatingStatus(true);
      const updated = await api.updateCase(id, { status: newStatus });
      setCaseData(updated);

      // Also record on-chain status audit if MetaMask is connected
      try {
        await contractService.recordStatusAudit(
          caseData.case_number,
          caseData.status,
          newStatus,
          statusReason || 'Investigator command update'
        );
        showToast('Status updated and recorded on-chain in audit registry!', 'success');
      } catch (chainErr: any) {
        console.warn('On-chain audit recording skipped or offline:', chainErr);
        showToast(`Case status updated to ${newStatus}. (Off-chain audit logged)`, 'success');
      }

      setStatusReason('');
      fetchCaseDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to update case status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEvidenceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }

    try {
      setUploading(true);
      const evidence = await api.uploadEvidence(id, selectedFile);
      showToast(`Evidence secured! SHA-256 calculated: ${evidence.sha256_hash.substring(0, 10)}...`, 'success');
      setSelectedFile(null);
      fetchCaseDetails();
    } catch (err: any) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterOnChain = async (evidence: EvidenceRecord) => {
    if (!caseData) return;

    try {
      setRegisteringHashId(evidence.id);
      showToast('Signing transaction in MetaMask to register evidence on-chain...', 'info');

      // Call FindGridEvidenceRegistry contract
      const receipt = await contractService.registerEvidence(
        evidence.sha256_hash,
        caseData.case_number,
        evidence.file_type || 'EVIDENCE'
      );

      showToast(`Transaction mined! Updating backend with TX ${receipt.txHash.substring(0, 8)}...`, 'info');

      // Update backend record
      await api.registerEvidenceOnChainReceipt(evidence.id, receipt.txHash, receipt.blockNumber);
      showToast('Evidence hash successfully registered on blockchain!', 'success');
      fetchCaseDetails();
    } catch (err: any) {
      console.error('Blockchain registration error:', err);
      showToast(err.message || 'Failed to register on blockchain.', 'error');
    } finally {
      setRegisteringHashId(null);
    }
  };

  if (loading || !caseData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading incident dossier...</span>
        </div>
      </div>
    );
  }

  const isAuthorizedInvestigator = role === 'investigator' || role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back button & Case Header */}
      <div className="mb-6">
        <Link
          to="/cases"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cases Directory
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-navy-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono font-bold text-cyan-400">{caseData.case_number}</span>
              <UrgencyBadge urgency={caseData.urgency} />
              <StatusBadge status={caseData.status} />
              {caseData.is_sensitive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-500/40">
                  PROTECTED SENSITIVE
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {caseData.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Subject: <span className="text-white font-semibold">{caseData.missing_person_name}</span> ({caseData.age || 'Unknown age'}, {caseData.gender || 'Unknown gender'})
            </p>
          </div>

          {/* Quick Stats / Action Banner */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-right">
              <span className="text-[10px] text-slate-400 block">Lead Investigator</span>
              <span className="text-xs font-mono text-cyan-300 font-medium">
                {formatAddress(caseData.assigned_investigator_wallet || '', 4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dossier Navigation Tabs */}
      <div className="flex gap-2 border-b border-navy-800 mb-6 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('dossier')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'dossier'
              ? 'bg-navy-850 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Incident Dossier
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'evidence'
              ? 'bg-navy-850 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" /> Secured Evidence ({evidenceList.length})
        </button>
        <button
          onClick={() => setActiveTab('sightings')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'sightings'
              ? 'bg-navy-850 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Correlated Sightings ({sightings.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'timeline'
              ? 'bg-navy-850 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Case Timeline ({timeline.length})
        </button>
      </div>

      {/* Tab 1: Dossier Details */}
      {activeTab === 'dossier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Description Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Physical Profile Card */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
              <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-navy-850 font-mono">
                PHYSICAL PROFILE & CIRCUMSTANCES
              </h3>

              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Narrative Description:</span>
                  <p className="text-slate-200 bg-navy-950 p-4 rounded-xl border border-navy-850">
                    {caseData.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-navy-950 p-3.5 rounded-xl border border-navy-850">
                    <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Clothing & Apparel Observed:</span>
                    <p className="text-slate-200">
                      {caseData.clothing_description || 'No detailed clothing description recorded.'}
                    </p>
                  </div>

                  <div className="bg-navy-950 p-3.5 rounded-xl border border-navy-850">
                    <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">Identifying Marks & Accessories:</span>
                    <p className="text-slate-200">
                      {caseData.identifying_features || 'No distinctive marks recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spatiotemporal Coordinates */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
              <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-navy-850 font-mono">
                LAST CONFIRMED FIX & PERIMETER
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px]">
                    <MapPin className="w-4 h-4" /> Location Name
                  </div>
                  <div className="text-white font-medium">{caseData.last_seen_location_name}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    GPS: {caseData.last_seen_lat.toFixed(4)}, {caseData.last_seen_lng.toFixed(4)}
                  </div>
                </div>

                <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px]">
                    <Clock className="w-4 h-4" /> Disappearance Timestamp
                  </div>
                  <div className="text-white font-medium">
                    {new Date(caseData.last_seen_time).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    System Intake: {new Date(caseData.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Reporter Information (Privacy Aware) */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
              <h3 className="text-sm font-bold text-white mb-4 pb-2 border-b border-navy-850 font-mono">
                REPORTING PARTY & CHAIN OF CUSTODY
              </h3>

              <div className="p-3 bg-navy-950 rounded-xl border border-navy-850 text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reporter:</span>
                  <span>{caseData.reporter_name || '[ANONYMOUS INTAKE]'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Relationship:</span>
                  <span>{caseData.reporter_relationship || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Record:</span>
                  <span className={caseData.reporter_contact?.includes('RESTRICTED') ? 'text-amber-400' : 'text-white'}>
                    {caseData.reporter_contact || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Status Operations Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status Update Card (Investigators only) */}
            {isAuthorizedInvestigator && (
              <div className="p-6 rounded-2xl bg-navy-900 border border-cyan-500/30 glow-border">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> AUTHORIZED STATUS CONTROL
                </h3>

                <form onSubmit={handleStatusChange} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">New Operational Status:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Active Search">Active Search (Ground Units Deployed)</option>
                      <option value="Under Review">Under Review (Triage Phase)</option>
                      <option value="Potential Match">Potential Match (Verifying Sighting)</option>
                      <option value="Resolved">Resolved (Subject Located Safe)</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Reason / Justification:</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Sighting verified at Bayside Pier; dispatched volunteer sector 2..."
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 transition-all disabled:opacity-50"
                  >
                    {updatingStatus ? 'Recording Status Transition...' : 'Update Case Status & Record On-Chain'}
                  </button>
                </form>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 space-y-3">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2">QUICK NAVIGATION</h3>
              <Link
                to={`/map?case_id=${caseData.id}`}
                className="w-full py-2.5 px-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between"
              >
                <span>View on Search Map</span>
                <MapPin className="w-4 h-4 text-cyan-400" />
              </Link>
              <Link
                to={`/ai-matching?case_id=${caseData.id}`}
                className="w-full py-2.5 px-3 rounded-xl bg-navy-950 hover:bg-navy-850 border border-navy-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between"
              >
                <span>Check AI Match Candidates</span>
                <Radio className="w-4 h-4 text-cyan-400" />
              </Link>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Secured Evidence Management (Blockchain Verification) */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          
          {/* Upload New Evidence (Investigators only) */}
          {isAuthorizedInvestigator && (
            <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" /> SECURE NEW DIGITAL EVIDENCE FILE
              </h3>

              <form onSubmit={handleEvidenceUpload} className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900"
                  />
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    Accepts CCTV stills, video clips, cell ping logs, witness voice memos (max 25MB). SHA-256 computed on upload.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 shrink-0"
                >
                  {uploading ? 'Calculating SHA-256...' : 'Secure & Hash Evidence'}
                </button>
              </form>
            </div>
          )}

          {/* Evidence Records List */}
          <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-4 pb-2 border-b border-navy-850">
              SECURED CHAIN OF CUSTODY RECORDS
            </h3>

            {evidenceList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 font-mono">No evidence files secured for this case yet.</p>
            ) : (
              <div className="space-y-4">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-navy-950 border border-navy-850 hover:border-navy-750 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{ev.file_name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-navy-900 text-slate-400 rounded border border-navy-800">
                          {(ev.file_size / 1024).toFixed(1)} KB
                        </span>
                        {ev.is_verified_on_chain ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> ON-CHAIN VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                            PENDING ON-CHAIN REGISTRATION
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                        <span>SHA-256:</span>
                        <span className="text-slate-300">{ev.sha256_hash}</span>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 flex flex-wrap gap-4">
                        <span>Secured By: {formatAddress(ev.registered_by, 4)}</span>
                        {ev.on_chain_tx_hash && (
                          <span className="text-emerald-400">
                            Tx: {formatHash(ev.on_chain_tx_hash, 4)} (Block #{ev.block_number})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Registration Trigger Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {!ev.is_verified_on_chain && isAuthorizedInvestigator ? (
                        <button
                          onClick={() => handleRegisterOnChain(ev)}
                          disabled={registeringHashId === ev.id}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Blocks className="w-3.5 h-3.5" />
                          {registeringHashId === ev.id ? 'Confirming in MetaMask...' : 'Register on Blockchain'}
                        </button>
                      ) : (
                        <Link
                          to={`/blockchain?hash=${ev.sha256_hash}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-900 hover:bg-navy-850 border border-navy-800 text-slate-300 flex items-center gap-1"
                        >
                          Verify Integrity <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: Correlated Sightings */}
      {activeTab === 'sightings' && (
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
          <div className="flex items-center justify-between pb-4 border-b border-navy-850 mb-4">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              LINKED SIGHTINGS FOR THIS INCIDENT
            </h3>
            <Link
              to={`/sightings?case_id=${caseData.id}`}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Submit New Sighting
            </Link>
          </div>

          {sightings.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-mono">No sightings submitted for this case yet.</p>
          ) : (
            <div className="space-y-4">
              {sightings.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-navy-950 border border-navy-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{s.location_name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-slate-300">{s.description}</p>
                  {s.clothing_observed && (
                    <p className="text-[11px] text-cyan-300 font-mono">Observed Apparel: {s.clothing_observed}</p>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-1 border-t border-navy-900">
                    <span>Reported by: {s.reporter_name || formatAddress(s.reporter_wallet || '', 3)}</span>
                    <span>{new Date(s.sighting_time).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Chronological Case Timeline */}
      {activeTab === 'timeline' && (
        <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-6 pb-2 border-b border-navy-850">
            CHRONOLOGICAL INCIDENT LOG
          </h3>

          <div className="relative pl-6 border-l-2 border-navy-800 space-y-6">
            {timeline.map((item, index) => (
              <div key={index} className="relative">
                <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-navy-900" />
                <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-850">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-1">{item.details}</p>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Actor: {formatAddress(item.actor, 4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
