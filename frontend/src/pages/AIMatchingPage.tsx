import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BrainCircuit, ShieldCheck, CheckCircle2, XCircle, 
  AlertTriangle, RefreshCw, Sliders, ChevronDown, 
  MapPin, Clock, ArrowRight, Sparkles, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AIMatchCandidate, AIMatchStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatAddress } from '../services/crypto';

export const AIMatchingPage: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [candidates, setCandidates] = useState<AIMatchCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<number>(30);
  const [statusFilter, setStatusFilter] = useState<string>('Pending Review');
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Review modal
  const [selectedCandidate, setSelectedCandidate] = useState<AIMatchCandidate | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.getAIMatches({
        case_id: searchParams.get('case_id') || undefined,
        status: statusFilter || undefined,
        min_score: minScore,
      });
      setCandidates(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch AI candidates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [minScore, statusFilter]);

  const handleBatchEvaluate = async () => {
    try {
      setEvaluating(true);
      showToast('Running batch AI spatiotemporal correlation across all cases & sightings...', 'info');
      const result = await api.reevaluateAIMatches();
      showToast(`${result.message} (${result.new_matches_flagged} new candidates identified)`, 'success');
      fetchCandidates();
    } catch (err: any) {
      showToast(err.message || 'Batch evaluation failed.', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleReviewDecision = async (decision: AIMatchStatus) => {
    if (!selectedCandidate) return;

    try {
      setReviewing(true);
      await api.reviewAIMatch(selectedCandidate.id, decision, decisionNotes);
      showToast(`Decision recorded: Match marked as "${decision}". Audit trail updated.`, 'success');
      setSelectedCandidate(null);
      setDecisionNotes('');
      fetchCandidates();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit match review decision.', 'error');
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-cyan-400" /> AI REPORT MATCHING & CORRELATION
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy-850 text-cyan-300 border border-cyan-500/30">
              HUMAN-IN-THE-LOOP
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Explainable multi-factor scoring matching missing person descriptions against crowdsourced sightings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isInvestigator && (
            <button
              onClick={handleBatchEvaluate}
              disabled={evaluating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
              {evaluating ? 'Analyzing Matrix...' : 'Run Batch AI Evaluation'}
            </button>
          )}
        </div>
      </div>

      {/* Threshold & Filter Controls */}
      <div className="p-4 rounded-2xl bg-navy-900 border border-navy-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Minimum similarity slider */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 shrink-0">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Sensitivity Threshold:</span>
            <span className="text-cyan-400 font-bold">{minScore}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Review State:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-navy-950 border border-navy-800 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Candidates</option>
            <option value="Pending Review">Pending Review (Action Needed)</option>
            <option value="Confirmed Match">Confirmed Matches</option>
            <option value="Rejected">Rejected Candidates</option>
            <option value="Needs More Info">Needs More Info</option>
          </select>
        </div>

      </div>

      {/* Candidates Feed */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-xs font-mono text-slate-400">Evaluating multi-factor similarity matrix...</span>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-navy-900 border border-navy-800">
          <BrainCircuit className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-1">No AI Candidate Matches Above {minScore}%</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Lower the sensitivity threshold slider or click "Run Batch AI Evaluation" to scan for correlations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {candidates.map((cand) => {
            const scoreColor = cand.similarity_score >= 80 
              ? 'text-rose-400 border-rose-500/40 bg-rose-950/80' 
              : cand.similarity_score >= 60 
              ? 'text-cyan-400 border-cyan-500/40 bg-cyan-950/80'
              : 'text-amber-400 border-amber-500/40 bg-amber-950/80';

            return (
              <div
                key={cand.id}
                className="p-6 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/30 transition-all shadow-xl"
              >
                {/* Match Header with Score Gauge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-850 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        CASE MATCH CANDIDATE
                      </span>
                      <StatusBadge status={cand.status} />
                    </div>
                    <h3 className="text-base font-bold text-white">
                      {cand.case_person_name ? `${cand.case_person_name} — ` : ''}{cand.case_title || 'Missing Person Case'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Correlated Sighting Fix: <span className="text-slate-200">{cand.sighting_location || 'Field Location'}</span>
                    </p>
                  </div>

                  {/* Similarity Score Badge */}
                  <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 shrink-0 ${scoreColor}`}>
                    <div>
                      <span className="text-[10px] font-mono block uppercase tracking-wider opacity-80">Composite Score</span>
                      <span className="text-2xl font-black font-mono leading-none">{cand.similarity_score}%</span>
                    </div>
                  </div>
                </div>

                {/* 4-Factor Explainable Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {cand.contributing_factors.map((f, i) => (
                    <div key={i} className="p-3 bg-navy-950 rounded-xl border border-navy-850 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>{f.factor_name}</span>
                        <span className="text-cyan-400 font-bold">{f.score}% (wt {f.weight}%)</span>
                      </div>
                      <div className="w-full bg-navy-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, f.score))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight pt-1 truncate" title={f.detail}>
                        {f.detail}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Human Explainability Recommendation */}
                <div className="p-3.5 rounded-xl bg-navy-950 border border-cyan-500/20 text-xs text-slate-200 mb-4">
                  <span className="font-bold text-cyan-400 font-mono block mb-0.5">AI REVIEW RECOMMENDATION:</span>
                  <p className="leading-relaxed">{cand.review_recommendation}</p>
                </div>

                {/* Discrepancies & Conflicts (if any) */}
                {cand.missing_or_conflicting && cand.missing_or_conflicting.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 mb-4">
                    <span className="font-semibold text-amber-300 block mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Flagged Discrepancies or Incomplete Attributes:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {cand.missing_or_conflicting.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reviewer Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-navy-850">
                  <div className="text-[11px] font-mono text-slate-400">
                    {cand.reviewed_by ? (
                      <span>Reviewed by {formatAddress(cand.reviewed_by, 4)} on {new Date(cand.reviewed_at || '').toLocaleDateString()}</span>
                    ) : (
                      <span className="text-amber-400">Awaiting investigator verification decision</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/cases/${cand.case_id}`}
                      className="px-3 py-1.5 rounded-xl text-xs bg-navy-950 hover:bg-navy-850 border border-navy-800 text-slate-300"
                    >
                      Inspect Case File
                    </Link>

                    {isInvestigator && cand.status === 'Pending Review' && (
                      <button
                        onClick={() => setSelectedCandidate(cand)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow"
                      >
                        Submit Review Decision
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-2">
              INVESTIGATOR MATCH DECISION
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Case: {selectedCandidate.case_title || selectedCandidate.case_id} — Similarity: {selectedCandidate.similarity_score}%
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">Investigator Decision Rationale:</label>
              <textarea
                rows={3}
                placeholder="Document your verification steps, surveillance cross-check, or reason for rejection..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReviewDecision('Confirmed Match')}
                disabled={reviewing}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept Match
              </button>
              <button
                onClick={() => handleReviewDecision('Rejected')}
                disabled={reviewing}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="py-2.5 px-4 rounded-xl text-xs bg-navy-950 text-slate-300 border border-navy-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
