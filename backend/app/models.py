import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wallet_address = Column(String(42), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    organization = Column(String(150), nullable=True)
    badge_number = Column(String(50), nullable=True)
    role = Column(String(20), nullable=False, default="volunteer", index=True) # admin, investigator, volunteer, public
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class AuthenticationNonce(Base):
    __tablename__ = "authentication_nonces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wallet_address = Column(String(42), nullable=False, index=True)
    nonce = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_consumed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class MissingPersonCase(Base):
    __tablename__ = "missing_person_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_number = Column(String(30), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    missing_person_name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(30), nullable=True)
    description = Column(Text, nullable=False)
    clothing_description = Column(Text, nullable=True)
    identifying_features = Column(Text, nullable=True)
    last_seen_time = Column(DateTime(timezone=True), nullable=False)
    last_seen_location_name = Column(String(255), nullable=False)
    last_seen_lat = Column(Float, nullable=False)
    last_seen_lng = Column(Float, nullable=False)
    status = Column(String(30), nullable=False, default="Submitted", index=True)
    # Statuses: Submitted, Under Review, Active Search, Potential Match, Resolved, Archived
    urgency = Column(String(20), nullable=False, default="Medium", index=True)
    # Urgencies: Low, Medium, High, Critical
    reporter_name = Column(String(150), nullable=True)
    reporter_contact = Column(String(100), nullable=True)
    reporter_relationship = Column(String(100), nullable=True)
    assigned_investigator_wallet = Column(String(42), nullable=True)
    is_sensitive = Column(Boolean, nullable=False, default=False)
    primary_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    sightings = relationship("Sighting", back_populates="case", cascade="all, delete-orphan")
    evidence_records = relationship("EvidenceRecord", back_populates="case", cascade="all, delete-orphan")
    ai_matches = relationship("AIMatchCandidate", back_populates="case", cascade="all, delete-orphan")
    search_tasks = relationship("SearchTask", back_populates="case", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="case", cascade="all, delete-orphan")

class Sighting(Base):
    __tablename__ = "sightings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("missing_person_cases.id", ondelete="CASCADE"), nullable=True)
    sighting_time = Column(DateTime(timezone=True), nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    clothing_observed = Column(Text, nullable=True)
    reporter_wallet = Column(String(42), nullable=True)
    reporter_name = Column(String(150), nullable=True)
    reporter_contact = Column(String(100), nullable=True)
    status = Column(String(30), nullable=False, default="Submitted", index=True)
    # Statuses: Submitted, Under Review, Verified, Rejected
    investigator_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("MissingPersonCase", back_populates="sightings")
    ai_matches = relationship("AIMatchCandidate", back_populates="sighting", cascade="all, delete-orphan")

class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("missing_person_cases.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    file_path = Column(Text, nullable=False)
    sha256_hash = Column(String(66), nullable=False, index=True) # 0x...
    on_chain_tx_hash = Column(String(66), nullable=True)
    block_number = Column(Integer, nullable=True)
    registered_by = Column(String(42), nullable=False)
    is_verified_on_chain = Column(Boolean, nullable=False, default=False)
    registration_timestamp = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("MissingPersonCase", back_populates="evidence_records")

class AIMatchCandidate(Base):
    __tablename__ = "ai_match_candidates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("missing_person_cases.id", ondelete="CASCADE"), nullable=False)
    sighting_id = Column(String(36), ForeignKey("sightings.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Float, nullable=False) # 0 to 100
    textual_similarity = Column(Float, nullable=False)
    clothing_similarity = Column(Float, nullable=False)
    geo_distance_km = Column(Float, nullable=False)
    time_diff_hours = Column(Float, nullable=False)
    contributing_factors = Column(JSON, nullable=False, default=list)
    missing_or_conflicting = Column(JSON, nullable=False, default=list)
    review_recommendation = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="Pending Review", index=True)
    # Statuses: Pending Review, Confirmed Match, Rejected, Needs More Info
    reviewed_by = Column(String(42), nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("MissingPersonCase", back_populates="ai_matches")
    sighting = relationship("Sighting", back_populates="ai_matches")

class SearchTask(Base):
    __tablename__ = "search_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("missing_person_cases.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    zone_name = Column(String(100), nullable=False)
    zone_center_lat = Column(Float, nullable=False)
    zone_center_lng = Column(Float, nullable=False)
    zone_radius_meters = Column(Float, nullable=False, default=500.0)
    priority = Column(String(20), nullable=False, default="Medium") # Low, Medium, High, Urgent
    status = Column(String(30), nullable=False, default="Open", index=True) # Open, Assigned, In Progress, Completed, Cancelled
    created_by = Column(String(42), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case = relationship("MissingPersonCase", back_populates="search_tasks")
    assignments = relationship("VolunteerAssignment", back_populates="task", cascade="all, delete-orphan")

class VolunteerAssignment(Base):
    __tablename__ = "volunteer_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("search_tasks.id", ondelete="CASCADE"), nullable=False)
    volunteer_wallet = Column(String(42), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="Assigned") # Assigned, Accepted, In Progress, Completed, Declined
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    task = relationship("SearchTask", back_populates="assignments")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("missing_person_cases.id", ondelete="SET NULL"), nullable=True)
    actor_wallet = Column(String(42), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    details = Column(JSON, nullable=False, default=dict)
    ip_address = Column(String(50), nullable=True)
    on_chain_tx_hash = Column(String(66), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    case = relationship("MissingPersonCase", back_populates="audit_events")
