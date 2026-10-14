from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# --- Auth Schemas ---
class NonceRequest(BaseModel):
    wallet_address: str = Field(..., description="Ethereum wallet address (0x...)")

class NonceResponse(BaseModel):
    wallet_address: str
    nonce: str
    message: str
    expires_at: datetime

class VerifySignatureRequest(BaseModel):
    wallet_address: str
    signature: str
    nonce: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    wallet_address: str
    profile: Optional[Dict[str, Any]] = None

class DemoLoginRequest(BaseModel):
    role: str = Field("investigator", description="admin, investigator, volunteer")
    wallet_address: Optional[str] = None

# --- Profile Schemas ---
class ProfileBase(BaseModel):
    wallet_address: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    organization: Optional[str] = None
    badge_number: Optional[str] = None
    role: str = "volunteer"

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    organization: Optional[str] = None
    badge_number: Optional[str] = None
    role: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Case Schemas ---
class CaseBase(BaseModel):
    title: str
    missing_person_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    description: str
    clothing_description: Optional[str] = None
    identifying_features: Optional[str] = None
    last_seen_time: datetime
    last_seen_location_name: str
    last_seen_lat: float
    last_seen_lng: float
    urgency: str = "Medium" # Low, Medium, High, Critical
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    reporter_relationship: Optional[str] = None
    is_sensitive: bool = False
    primary_image_url: Optional[str] = None

class CaseCreate(CaseBase):
    case_number: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    missing_person_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    description: Optional[str] = None
    clothing_description: Optional[str] = None
    identifying_features: Optional[str] = None
    last_seen_time: Optional[datetime] = None
    last_seen_location_name: Optional[str] = None
    last_seen_lat: Optional[float] = None
    last_seen_lng: Optional[float] = None
    status: Optional[str] = None
    urgency: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    reporter_relationship: Optional[str] = None
    assigned_investigator_wallet: Optional[str] = None
    is_sensitive: Optional[bool] = None
    primary_image_url: Optional[str] = None

class CaseResponse(CaseBase):
    id: str
    case_number: str
    status: str
    assigned_investigator_wallet: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Sighting Schemas ---
class SightingCreate(BaseModel):
    case_id: Optional[str] = None
    sighting_time: datetime
    location_name: str
    latitude: float
    longitude: float
    description: str
    clothing_observed: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None

class SightingUpdate(BaseModel):
    status: Optional[str] = None
    investigator_notes: Optional[str] = None

class SightingResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    sighting_time: datetime
    location_name: str
    latitude: float
    longitude: float
    description: str
    clothing_observed: Optional[str] = None
    reporter_wallet: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    status: str
    investigator_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Evidence Schemas ---
class EvidenceCreate(BaseModel):
    case_id: str
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    sha256_hash: str
    on_chain_tx_hash: Optional[str] = None
    block_number: Optional[int] = None

class EvidenceOnChainUpdate(BaseModel):
    on_chain_tx_hash: str
    block_number: Optional[int] = None
    registration_timestamp: Optional[datetime] = None

class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    sha256_hash: str
    on_chain_tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    registered_by: str
    is_verified_on_chain: bool
    registration_timestamp: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EvidenceVerificationResult(BaseModel):
    file_hash: str
    is_valid: bool
    matched_record: Optional[EvidenceResponse] = None
    on_chain_verified: bool = False
    details: str

# --- AI Match Schemas ---
class AIMatchFactor(BaseModel):
    factor_name: str
    score: float
    weight: float
    detail: str

class AIMatchCandidateResponse(BaseModel):
    id: str
    case_id: str
    sighting_id: str
    similarity_score: float
    textual_similarity: float
    clothing_similarity: float
    geo_distance_km: float
    time_diff_hours: float
    contributing_factors: List[Dict[str, Any]]
    missing_or_conflicting: List[str]
    review_recommendation: str
    status: str
    reviewed_by: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    case_title: Optional[str] = None
    case_person_name: Optional[str] = None
    sighting_location: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AIMatchReviewRequest(BaseModel):
    status: str = Field(..., description="Confirmed Match, Rejected, Needs More Info")
    reviewer_notes: Optional[str] = None

# --- Search Task Schemas ---
class SearchTaskCreate(BaseModel):
    case_id: str
    title: str
    description: str
    zone_name: str
    zone_center_lat: float
    zone_center_lng: float
    zone_radius_meters: float = 500.0
    priority: str = "Medium"

class SearchTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class VolunteerAssignmentCreate(BaseModel):
    volunteer_wallet: str
    notes: Optional[str] = None

class VolunteerAssignmentResponse(BaseModel):
    id: str
    task_id: str
    volunteer_wallet: str
    status: str
    notes: Optional[str] = None
    assigned_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SearchTaskResponse(BaseModel):
    id: str
    case_id: str
    title: str
    description: str
    zone_name: str
    zone_center_lat: float
    zone_center_lng: float
    zone_radius_meters: float
    priority: str
    status: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    assignments: List[VolunteerAssignmentResponse] = []

    model_config = ConfigDict(from_attributes=True)

# --- Audit Schemas ---
class AuditEventResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    actor_wallet: str
    action_type: str
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    on_chain_tx_hash: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Analytics Schemas ---
class AnalyticsResponse(BaseModel):
    total_active_cases: int
    cases_awaiting_review: int
    total_sightings: int
    sightings_under_review: int
    potential_matches_pending: int
    cases_resolved: int
    tasks_in_progress: int
    total_evidence_files: int
    blockchain_verified_count: int
    urgency_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
