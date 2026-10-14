-- ============================================================================
-- FindGrid — Database Schema & Row Level Security (Supabase PostgreSQL)
-- AI-Powered Missing Person Search & Coordination Platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles & Roles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    full_name VARCHAR(150),
    email VARCHAR(255),
    organization VARCHAR(150),
    badge_number VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'volunteer' CHECK (role IN ('admin', 'investigator', 'volunteer', 'public')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. Authentication Nonces Table (Replay attack prevention)
CREATE TABLE IF NOT EXISTS authentication_nonces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL,
    nonce VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nonces_wallet ON authentication_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nonces_nonce ON authentication_nonces(nonce);

-- 3. Missing Person Cases Table
CREATE TABLE IF NOT EXISTS missing_person_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    missing_person_name VARCHAR(150) NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    gender VARCHAR(30),
    description TEXT NOT NULL,
    clothing_description TEXT,
    identifying_features TEXT,
    last_seen_time TIMESTAMPTZ NOT NULL,
    last_seen_location_name VARCHAR(255) NOT NULL,
    last_seen_lat DOUBLE PRECISION NOT NULL,
    last_seen_lng DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (
        status IN ('Submitted', 'Under Review', 'Active Search', 'Potential Match', 'Resolved', 'Archived')
    ),
    urgency VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (
        urgency IN ('Low', 'Medium', 'High', 'Critical')
    ),
    reporter_name VARCHAR(150),
    reporter_contact VARCHAR(100),
    reporter_relationship VARCHAR(100),
    assigned_investigator_wallet VARCHAR(42),
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    primary_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON missing_person_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_urgency ON missing_person_cases(urgency);
CREATE INDEX IF NOT EXISTS idx_cases_case_num ON missing_person_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_location ON missing_person_cases(last_seen_lat, last_seen_lng);

-- 4. Sightings Table
CREATE TABLE IF NOT EXISTS sightings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES missing_person_cases(id) ON DELETE CASCADE,
    sighting_time TIMESTAMPTZ NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    clothing_observed TEXT,
    reporter_wallet VARCHAR(42),
    reporter_name VARCHAR(150),
    reporter_contact VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (
        status IN ('Submitted', 'Under Review', 'Verified', 'Rejected')
    ),
    investigator_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sightings_case_id ON sightings(case_id);
CREATE INDEX IF NOT EXISTS idx_sightings_status ON sightings(status);

-- 5. Evidence Records Table (Off-chain storage with cryptographic hashes)
CREATE TABLE IF NOT EXISTS evidence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES missing_person_cases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    sha256_hash VARCHAR(66) NOT NULL, -- "0x..." or 64 hex chars
    on_chain_tx_hash VARCHAR(66),
    block_number BIGINT,
    registered_by VARCHAR(42) NOT NULL,
    is_verified_on_chain BOOLEAN NOT NULL DEFAULT FALSE,
    registration_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence_records(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence_records(sha256_hash);

-- 6. AI Match Candidates Table
CREATE TABLE IF NOT EXISTS ai_match_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES missing_person_cases(id) ON DELETE CASCADE,
    sighting_id UUID REFERENCES sightings(id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION NOT NULL, -- 0 to 100
    textual_similarity DOUBLE PRECISION NOT NULL,
    clothing_similarity DOUBLE PRECISION NOT NULL,
    geo_distance_km DOUBLE PRECISION NOT NULL,
    time_diff_hours DOUBLE PRECISION NOT NULL,
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_or_conflicting JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_recommendation TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending Review' CHECK (
        status IN ('Pending Review', 'Confirmed Match', 'Rejected', 'Needs More Info')
    ),
    reviewed_by VARCHAR(42),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aimatch_case_id ON ai_match_candidates(case_id);
CREATE INDEX IF NOT EXISTS idx_aimatch_status ON ai_match_candidates(status);

-- 7. Search Tasks Table
CREATE TABLE IF NOT EXISTS search_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES missing_person_cases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    zone_center_lat DOUBLE PRECISION NOT NULL,
    zone_center_lng DOUBLE PRECISION NOT NULL,
    zone_radius_meters DOUBLE PRECISION NOT NULL DEFAULT 500,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (
        status IN ('Open', 'Assigned', 'In Progress', 'Completed', 'Cancelled')
    ),
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON search_tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON search_tasks(status);

-- 8. Volunteer Assignments Table
CREATE TABLE IF NOT EXISTS volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES search_tasks(id) ON DELETE CASCADE,
    volunteer_wallet VARCHAR(42) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Assigned' CHECK (
        status IN ('Assigned', 'Accepted', 'In Progress', 'Completed', 'Declined')
    ),
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assignments_task ON volunteer_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON volunteer_assignments(volunteer_wallet);

-- 9. Audit Events Table (Tamper-evident system logs)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES missing_person_cases(id) ON DELETE SET NULL,
    actor_wallet VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    on_chain_tx_hash VARCHAR(66),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_case ON audit_events(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_wallet);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action_type);

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE missing_person_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE USING (wallet_address = current_setting('request.jwt.claim.wallet', true));

-- 2. Missing Person Cases Policies
-- Public can view active, non-sensitive cases
CREATE POLICY "Public cases viewable" 
    ON missing_person_cases FOR SELECT 
    USING (is_sensitive = FALSE OR current_setting('request.jwt.claim.role', true) IN ('admin', 'investigator'));

-- Investigators and Admins can insert and update cases
CREATE POLICY "Investigators can insert cases" 
    ON missing_person_cases FOR INSERT 
    WITH CHECK (current_setting('request.jwt.claim.role', true) IN ('admin', 'investigator'));

CREATE POLICY "Investigators can update cases" 
    ON missing_person_cases FOR UPDATE 
    USING (current_setting('request.jwt.claim.role', true) IN ('admin', 'investigator'));

-- 3. Evidence Records Policies
CREATE POLICY "Investigators view evidence" 
    ON evidence_records FOR SELECT 
    USING (current_setting('request.jwt.claim.role', true) IN ('admin', 'investigator'));

CREATE POLICY "Investigators insert evidence" 
    ON evidence_records FOR INSERT 
    WITH CHECK (current_setting('request.jwt.claim.role', true) IN ('admin', 'investigator'));

-- 4. Search Tasks Policies
CREATE POLICY "Volunteers & investigators view tasks" 
    ON search_tasks FOR SELECT 
    USING (true);

CREATE POLICY "Investigators manage tasks" 
    ON search_tasks FOR ALL 
    USING (current_setting('request.jwt.claim.role', true) IN ('admin', 'investigator'));
