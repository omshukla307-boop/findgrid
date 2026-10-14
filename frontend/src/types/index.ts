export type UserRole = 'admin' | 'investigator' | 'volunteer' | 'public';

export type CaseStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Active Search' 
  | 'Potential Match' 
  | 'Resolved' 
  | 'Archived';

export type CaseUrgency = 'Low' | 'Medium' | 'High' | 'Critical';

export type SightingStatus = 'Submitted' | 'Under Review' | 'Verified' | 'Rejected';

export type AIMatchStatus = 'Pending Review' | 'Confirmed Match' | 'Rejected' | 'Needs More Info';

export type TaskStatus = 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface UserProfile {
  id: string;
  wallet_address: string;
  full_name?: string;
  email?: string;
  organization?: string;
  badge_number?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MissingPersonCase {
  id: string;
  case_number: string;
  title: string;
  missing_person_name: string;
  age?: number;
  gender?: string;
  description: string;
  clothing_description?: string;
  identifying_features?: string;
  last_seen_time: string;
  last_seen_location_name: string;
  last_seen_lat: number;
  last_seen_lng: number;
  status: CaseStatus;
  urgency: CaseUrgency;
  reporter_name?: string;
  reporter_contact?: string;
  reporter_relationship?: string;
  assigned_investigator_wallet?: string;
  is_sensitive: boolean;
  primary_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Sighting {
  id: string;
  case_id?: string;
  sighting_time: string;
  location_name: string;
  latitude: number;
  longitude: number;
  description: string;
  clothing_observed?: string;
  reporter_wallet?: string;
  reporter_name?: string;
  reporter_contact?: string;
  status: SightingStatus;
  investigator_notes?: string;
  created_at: string;
}

export interface EvidenceRecord {
  id: string;
  case_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path: string;
  sha256_hash: string;
  on_chain_tx_hash?: string;
  block_number?: number;
  registered_by: string;
  is_verified_on_chain: boolean;
  registration_timestamp?: string;
  created_at: string;
}

export interface AIMatchFactor {
  factor_name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface AIMatchCandidate {
  id: string;
  case_id: string;
  sighting_id: string;
  similarity_score: number;
  textual_similarity: number;
  clothing_similarity: number;
  geo_distance_km: number;
  time_diff_hours: number;
  contributing_factors: AIMatchFactor[];
  missing_or_conflicting: string[];
  review_recommendation: string;
  status: AIMatchStatus;
  reviewed_by?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  created_at: string;
  case_title?: string;
  case_person_name?: string;
  sighting_location?: string;
}

export interface SearchTask {
  id: string;
  case_id: string;
  title: string;
  description: string;
  zone_name: string;
  zone_center_lat: number;
  zone_center_lng: number;
  zone_radius_meters: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: TaskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignments: VolunteerAssignment[];
}

export interface VolunteerAssignment {
  id: string;
  task_id: string;
  volunteer_wallet: string;
  status: 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Declined';
  notes?: string;
  assigned_at: string;
  completed_at?: string;
}

export interface AuditEvent {
  id: string;
  case_id?: string;
  actor_wallet: string;
  action_type: string;
  details: Record<string, any>;
  ip_address?: string;
  on_chain_tx_hash?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_active_cases: number;
  cases_awaiting_review: number;
  total_sightings: number;
  sightings_under_review: number;
  potential_matches_pending: number;
  cases_resolved: number;
  tasks_in_progress: number;
  total_evidence_files: number;
  blockchain_verified_count: number;
  urgency_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  recent_activity: Array<{
    id: string;
    action: string;
    actor: string;
    details: any;
    timestamp: string;
    tx_hash?: string;
  }>;
}

export interface EvidenceVerificationResult {
  file_hash: string;
  is_valid: boolean;
  matched_record: EvidenceRecord | null;
  on_chain_verified: boolean;
  details: string;
}
