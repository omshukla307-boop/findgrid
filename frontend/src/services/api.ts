import {
  UserProfile, MissingPersonCase, Sighting, EvidenceRecord,
  AIMatchCandidate, SearchTask, VolunteerAssignment, AuditEvent,
  AnalyticsOverview, EvidenceVerificationResult
} from '../types';

// Service binding support: BACKEND_URL injected by Vercel or environment override,
// falling back to relative '/api' for production rewrites and Vite dev proxy.
const API_BASE =
  (typeof process !== 'undefined' && (process.env as Record<string, string | undefined>)?.BACKEND_URL
    ? `${(process.env as Record<string, string | undefined>).BACKEND_URL}/api`
    : null) ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('findgrid_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    throw new Error('Failed to read server response body stream.');
  }

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON format
    }
  }

  if (!res.ok) {
    let errorDetail = 'API request failed';
    if (data && (data.detail || data.message)) {
      const d = data.detail || data.message;
      errorDetail = typeof d === 'string' ? d : JSON.stringify(d);
    } else if (text) {
      if (
        text.includes('ECONNREFUSED') ||
        text.includes('proxy error') ||
        text.includes('<!DOCTYPE') ||
        text.includes('<html') ||
        text.includes('500 Internal Server Error') ||
        text.includes('504 Gateway')
      ) {
        errorDetail = 'Backend API is currently offline. Please ensure the FastAPI server is running on port 8000.';
      } else {
        errorDetail = text.length > 200 ? text.substring(0, 200) + '...' : text;
      }
    } else {
      errorDetail = `Server returned HTTP ${res.status} (${res.statusText})`;
    }
    throw new Error(errorDetail);
  }

  return (data !== null ? data : ({} as T)) as T;
}

export const api = {
  // --- Auth ---
  async getNonce(walletAddress: string) {
    const res = await fetch(`${API_BASE}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
    return handleResponse<{
      wallet_address: string;
      nonce: string;
      message: string;
      expires_at: string;
    }>(res);
  },

  async verifySignature(walletAddress: string, signature: string, nonce: string) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        signature,
        nonce,
      }),
    });
    return handleResponse<{
      access_token: string;
      token_type: string;
      role: string;
      wallet_address: string;
      profile: UserProfile;
    }>(res);
  },

  async demoLogin(role: string, walletAddress?: string) {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, wallet_address: walletAddress }),
    });
    return handleResponse<{
      access_token: string;
      token_type: string;
      role: string;
      wallet_address: string;
      profile: UserProfile;
    }>(res);
  },

  async loginWithEmail(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{
      access_token: string;
      token_type: string;
      role: string;
      wallet_address: string;
      profile: UserProfile;
    }>(res);
  },

  async loginCitizenVerified(data: {
    full_name: string;
    email: string;
    citizen_id?: string;
    fathers_name?: string;
    gender?: string;
    phone?: string;
    organization?: string;
    wallet_address?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/login-citizen-verified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      access_token: string;
      token_type: string;
      role: string;
      wallet_address: string;
      profile: UserProfile;
    }>(res);
  },

  async registerCitizen(data: {
    full_name: string;
    email: string;
    password: string;
    organization?: string;
    role?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      access_token: string;
      token_type: string;
      role: string;
      wallet_address: string;
      profile: UserProfile;
    }>(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<UserProfile>(res);
  },

  // --- Cases ---
  async getCases(params?: { q?: string; status?: string; urgency?: string }) {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.status) query.set('status', params.status);
    if (params?.urgency) query.set('urgency', params.urgency);

    const res = await fetch(`${API_BASE}/cases?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<MissingPersonCase[]>(res);
  },

  async getCase(id: string) {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<MissingPersonCase>(res);
  },

  async createCase(caseData: Partial<MissingPersonCase>) {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(caseData),
    });
    return handleResponse<MissingPersonCase>(res);
  },

  async updateCase(id: string, caseData: Partial<MissingPersonCase>) {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(caseData),
    });
    return handleResponse<MissingPersonCase>(res);
  },

  async getCaseTimeline(id: string) {
    const res = await fetch(`${API_BASE}/cases/${id}/timeline`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<Array<{
      type: string;
      title: string;
      timestamp: string;
      actor: string;
      details: string;
      status?: string;
    }>>(res);
  },

  // --- Sightings ---
  async getSightings(params?: { case_id?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.case_id) query.set('case_id', params.case_id);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/sightings?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<Sighting[]>(res);
  },

  async submitSighting(sighting: Partial<Sighting>) {
    const res = await fetch(`${API_BASE}/sightings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(sighting),
    });
    return handleResponse<Sighting>(res);
  },

  async updateSighting(id: string, data: { status?: string; investigator_notes?: string }) {
    const res = await fetch(`${API_BASE}/sightings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Sighting>(res);
  },

  // --- AI Matches ---
  async getAIMatches(params?: { case_id?: string; status?: string; min_score?: number }) {
    const query = new URLSearchParams();
    if (params?.case_id) query.set('case_id', params.case_id);
    if (params?.status) query.set('status', params.status);
    if (params?.min_score !== undefined) query.set('min_score', params.min_score.toString());

    const res = await fetch(`${API_BASE}/ai/candidates?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<AIMatchCandidate[]>(res);
  },

  async reviewAIMatch(id: string, status: string, notes?: string) {
    const res = await fetch(`${API_BASE}/ai/candidates/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status, reviewer_notes: notes }),
    });
    return handleResponse<AIMatchCandidate>(res);
  },

  async reevaluateAIMatches() {
    const res = await fetch(`${API_BASE}/ai/re-evaluate`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ message: string; new_matches_flagged: number }>(res);
  },

  // --- Evidence ---
  async getEvidence(caseId?: string) {
    const query = new URLSearchParams();
    if (caseId) query.set('case_id', caseId);

    const res = await fetch(`${API_BASE}/evidence?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<EvidenceRecord[]>(res);
  },

  async uploadEvidence(caseId: string, file: File) {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/evidence/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse<EvidenceRecord>(res);
  },

  async registerEvidenceOnChainReceipt(
    evidenceId: string,
    txHash: string,
    blockNumber?: number
  ) {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}/register-chain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        on_chain_tx_hash: txHash,
        block_number: blockNumber,
      }),
    });
    return handleResponse<EvidenceRecord>(res);
  },

  async verifyEvidenceFile(file: File | Blob) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/evidence/verify-file`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<EvidenceVerificationResult>(res);
  },

  // --- Volunteers & Tasks ---
  async getVolunteers(role: string = 'volunteer') {
    const res = await fetch(`${API_BASE}/volunteers?role=${role}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<UserProfile[]>(res);
  },

  async getTasks(params?: { case_id?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.case_id) query.set('case_id', params.case_id);
    if (params?.status) query.set('status', params.status);

    const res = await fetch(`${API_BASE}/volunteers/tasks?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<SearchTask[]>(res);
  },

  async createTask(task: Partial<SearchTask>) {
    const res = await fetch(`${API_BASE}/volunteers/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(task),
    });
    return handleResponse<SearchTask>(res);
  },

  async updateTask(id: string, task: Partial<SearchTask>) {
    const res = await fetch(`${API_BASE}/volunteers/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(task),
    });
    return handleResponse<SearchTask>(res);
  },

  async assignVolunteer(taskId: string, volunteerWallet: string, notes?: string) {
    const res = await fetch(`${API_BASE}/volunteers/tasks/${taskId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        volunteer_wallet: volunteerWallet,
        notes,
      }),
    });
    return handleResponse<VolunteerAssignment>(res);
  },

  async updateAssignmentStatus(assignmentId: string, status: string, notes?: string) {
    const query = new URLSearchParams();
    query.set('status_str', status);
    if (notes) query.set('notes', notes);

    const res = await fetch(`${API_BASE}/volunteers/assignments/${assignmentId}?${query.toString()}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<VolunteerAssignment>(res);
  },

  // --- Audit ---
  async getAuditEvents(params?: { case_id?: string; actor_wallet?: string; action_type?: string }) {
    const query = new URLSearchParams();
    if (params?.case_id) query.set('case_id', params.case_id);
    if (params?.actor_wallet) query.set('actor_wallet', params.actor_wallet);
    if (params?.action_type) query.set('action_type', params.action_type);

    const res = await fetch(`${API_BASE}/audit?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<AuditEvent[]>(res);
  },

  // --- Analytics ---
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return handleResponse<AnalyticsOverview>(res);
  },

  // --- Users ---
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<UserProfile[]>(res);
  },

  async updateUser(id: string, data: Partial<UserProfile>) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<UserProfile>(res);
  },
};
