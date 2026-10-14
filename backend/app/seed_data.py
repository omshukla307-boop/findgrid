import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import (
    Profile, MissingPersonCase, Sighting, EvidenceRecord,
    AIMatchCandidate, SearchTask, VolunteerAssignment, AuditEvent
)
from app.ai_engine import AIMatchingEngine

def seed_database(db: Session):
    from app.auth import hash_password
    default_pw_hash = hash_password("Password123!")

    # 1. Profiles & Responders (Always ensure seeded)
    profiles = [
        Profile(
            wallet_address="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".lower(), # Hardhat Account #0
            full_name="Dr. Elena Vance",
            email="elena.vance@findgrid.org",
            organization="National Missing & Exploited Coordination Office",
            badge_number="ADM-8801",
            role="admin",
            password_hash=default_pw_hash,
            is_active=True
        ),
        Profile(
            wallet_address="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(), # Hardhat Account #1
            full_name="Det. Marcus Reed",
            email="marcus.reed@metro-police.gov",
            organization="Metropolitan Cyber & Missing Persons Division",
            badge_number="DET-4029",
            role="investigator",
            password_hash=default_pw_hash,
            is_active=True
        ),
        Profile(
            wallet_address="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(), # Hardhat Account #2
            full_name="Special Agent Sarah Chen",
            email="s.chen@sar-network.org",
            organization="Federal Search & Rescue Rapid Deployment",
            badge_number="SAR-1104",
            role="investigator",
            password_hash=default_pw_hash,
            is_active=True
        ),
        Profile(
            wallet_address="0x90f79bf6eb2c4f870365e785982e1f101e93b906".lower(), # Hardhat Account #3
            full_name="Alex Martinez",
            email="alex.m@groundpatrol.org",
            organization="Civil Air & Volunteer Ground Patrol",
            badge_number="VOL-052",
            role="volunteer",
            password_hash=default_pw_hash,
            is_active=True
        ),
        Profile(
            wallet_address="0x15d34aaf54267db7d7c367839aaf71a00a2c6a65".lower(), # Hardhat Account #4
            full_name="Priya Sharma",
            email="priya.sharma@communityrescue.org",
            organization="Community Search Volunteer Alliance",
            badge_number="VOL-089",
            role="volunteer",
            password_hash=default_pw_hash,
            is_active=True
        ),
        Profile(
            wallet_address="0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f".lower(),
            full_name="Sarah Jenkins",
            email="citizen@findgrid.org",
            organization="Neighborhood Community Responder",
            badge_number="CIT-109",
            role="volunteer",
            password_hash=default_pw_hash,
            is_active=True
        ),
    ]
    for p in profiles:
        existing = db.query(Profile).filter(Profile.wallet_address == p.wallet_address).first()
        if not existing:
            db.add(p)
        elif not existing.password_hash:
            existing.password_hash = default_pw_hash
            if not existing.email:
                existing.email = p.email
    db.commit()

    # Check if database cases are already seeded
    if db.query(MissingPersonCase).count() > 0:
        return

    now = datetime.now(timezone.utc)
    db.commit()

    # 2. Missing Person Cases (Realistic Synthetic Demonstration Cases)
    case_1 = MissingPersonCase(
        case_number="FG-2026-0811",
        title="Disappearance near Riverside Botanical Gardens",
        missing_person_name="Maya Lin",
        age=22,
        gender="Female",
        description="University student studying environmental biology. Disappeared after conducting soil sampling field research near north riverbanks. Height 5'5\", medium athletic build, dark shoulder-length hair, black-rimmed spectacles.",
        clothing_description="Olive green waterproof windbreaker jacket, black athletic leggings, white canvas sneakers, olive canvas backpack with yellow botanical pin.",
        identifying_features="Small scar near left eyebrow, wears round black spectacles, silver lotus ring on right hand.",
        last_seen_time=now - timedelta(hours=14),
        last_seen_location_name="Riverside Botanical Gardens North Gate",
        last_seen_lat=37.7749,
        last_seen_lng=-122.4194,
        status="Active Search",
        urgency="Critical",
        reporter_name="David Lin",
        reporter_contact="555-0192-384",
        reporter_relationship="Father",
        assigned_investigator_wallet="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    )

    case_2 = MissingPersonCase(
        case_number="FG-2026-0812",
        title="Silver Alert: Disorientation & Wandering",
        missing_person_name="Robert 'Bobby' Hayes",
        age=74,
        gender="Male",
        description="Elderly male with early-stage cognitive disorientation. Walked past facility gate during morning grounds walk. Soft-spoken, responsive to his name. Height 5'10\", slim build, thinning silver-gray hair.",
        clothing_description="Navy blue knit cardigan sweater, beige khaki slacks, brown leather orthopedic shoes, silver stainless steel watch.",
        identifying_features="Noticeable slight limp on left leg, silver wedding band, wears medical alert bracelet.",
        last_seen_time=now - timedelta(hours=6),
        last_seen_location_name="Pinecrest Senior Living Perimeter",
        last_seen_lat=37.7833,
        last_seen_lng=-122.4167,
        status="Under Review",
        urgency="High",
        reporter_name="Clara Hayes",
        reporter_contact="555-0144-889",
        reporter_relationship="Spouse",
        assigned_investigator_wallet="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    )

    case_3 = MissingPersonCase(
        case_number="FG-2026-0809",
        title="Transit Route Anomaly - High School Student",
        missing_person_name="Liam O'Connor",
        age=15,
        gender="Male",
        description="Did not arrive at home bus stop after high school robotics team meeting. Height 5'8\", lean build, curly light brown hair.",
        clothing_description="Heather gray hooded sweatshirt with robotics team patch, dark blue denim jeans, red high-top canvas sneakers, carrying black nylon sports duffle bag.",
        identifying_features="Dental braces with blue bands, freckles across nose bridge.",
        last_seen_time=now - timedelta(days=2),
        last_seen_location_name="Metro Transit Central Station Sector B",
        last_seen_lat=37.7892,
        last_seen_lng=-122.4014,
        status="Potential Match",
        urgency="Medium",
        reporter_name="Sarah O'Connor",
        reporter_contact="555-0129-472",
        reporter_relationship="Mother",
        assigned_investigator_wallet="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
    )

    case_4 = MissingPersonCase(
        case_number="FG-2026-0795",
        title="Alpine Trailhead Separation - Group Recon",
        missing_person_name="Sophia Rodriguez",
        age=29,
        gender="Female",
        description="Separated from hiking companions due to sudden high-altitude fog. Successfully recovered safe and uninjured by volunteer ground unit.",
        clothing_description="Red mountaineering shell jacket, charcoal hiking pants, trail boots.",
        identifying_features="Tattoo of compass rose on right forearm.",
        last_seen_time=now - timedelta(days=5),
        last_seen_location_name="Twin Peaks Ridge Trail Marker 4",
        last_seen_lat=37.7544,
        last_seen_lng=-122.4477,
        status="Resolved",
        urgency="Low",
        reporter_name="Trail Marshal Office",
        reporter_contact="555-0199-311",
        reporter_relationship="Law Enforcement Liaison",
        assigned_investigator_wallet="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    )

    db.add(case_1)
    db.add(case_2)
    db.add(case_3)
    db.add(case_4)
    db.commit()

    # 3. Sightings
    sighting_1 = Sighting(
        case_id=case_1.id,
        sighting_time=case_1.last_seen_time + timedelta(hours=2, minutes=15),
        location_name="Bayside Ferry Pier Boardwalk Cafe",
        latitude=37.7812,
        longitude=-122.4101,
        description="Young woman matching description observed asking counter clerk for bus directions to interstate terminal. Appeared fatigued, carried olive backpack with pin.",
        clothing_observed="Olive green windbreaker jacket, black athletic leggings, white sneakers.",
        reporter_wallet="0x90f79bf6eb2c4f870365e785982e1f101e93b906".lower(),
        reporter_name="Alex Martinez (Ground Volunteer)",
        reporter_contact="555-0188-721",
        status="Under Review",
        investigator_notes="High correlation with Case FG-2026-0811. Pier security camera footage requested.",
    )

    sighting_2 = Sighting(
        case_id=case_2.id,
        sighting_time=case_2.last_seen_time + timedelta(hours=1, minutes=30),
        location_name="Maple Street Community Pharmacy Bench",
        latitude=37.7850,
        longitude=-122.4205,
        description="Elderly gentleman resting on wooden bench outside storefront. Looked slightly confused when asked if he needed assistance, holding a silver watch in left hand.",
        clothing_observed="Navy blue knit sweater, beige khaki pants, brown shoes.",
        reporter_wallet="0x15d34aaf54267db7d7c367839aaf71a00a2c6a65".lower(),
        reporter_name="Priya Sharma (Volunteer)",
        reporter_contact="555-0177-332",
        status="Verified",
        investigator_notes="Confirmed visual match by facility staff. Ground search dispatched to secure area.",
    )

    sighting_3 = Sighting(
        case_id=case_3.id,
        sighting_time=case_3.last_seen_time + timedelta(hours=3),
        location_name="Market Street Public Skate Plaza",
        latitude=37.7795,
        longitude=-122.4180,
        description="Youth seen conversing with group of skateboarders near public plaza transit kiosk. Had dark bag and distinctive red footwear.",
        clothing_observed="Gray hoodie, blue jeans, bright red sneakers.",
        reporter_wallet=None,
        reporter_name="Anonymous Citizen",
        reporter_contact="555-0100-291",
        status="Submitted",
        investigator_notes="Potential match identified by AI engine. Under initial investigator triage.",
    )

    db.add(sighting_1)
    db.add(sighting_2)
    db.add(sighting_3)
    db.commit()

    # 4. Evidence Records (with real SHA-256 hashes)
    evidence_content_1 = b"FindGrid Fictional Evidence CCTV Frame 2026-10-13 Sector North Riverbank Maya Lin"
    hash_1 = "0x" + hashlib.sha256(evidence_content_1).hexdigest()

    evidence_content_2 = b"FindGrid Fictional Cell Tower Triangulation Log Sector 4 Signal Ping"
    hash_2 = "0x" + hashlib.sha256(evidence_content_2).hexdigest()

    evidence_content_3 = b"FindGrid Fictional Pharmacy Surveillance Still Frame Maple St Bench Bobby Hayes"
    hash_3 = "0x" + hashlib.sha256(evidence_content_3).hexdigest()

    evidence_1 = EvidenceRecord(
        case_id=case_1.id,
        file_name="cctv_north_gate_oct13_1928utc.mp4",
        file_size=14205800,
        file_type="video/mp4",
        file_path="/uploads/cctv_north_gate_oct13_1928utc.mp4",
        sha256_hash=hash_1,
        on_chain_tx_hash="0x4e7a82bf9c3d10fa8e62bc1049ad5f3e91823abce8401f9c8d6215eb0741aa23",
        block_number=1849201,
        registered_by="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        is_verified_on_chain=True,
        registration_timestamp=now - timedelta(hours=12),
    )

    evidence_2 = EvidenceRecord(
        case_id=case_1.id,
        file_name="cell_tower_triangulation_sector4.pdf",
        file_size=845200,
        file_type="application/pdf",
        file_path="/uploads/cell_tower_triangulation_sector4.pdf",
        sha256_hash=hash_2,
        on_chain_tx_hash="0x91fa23cb7e8401f9c8d6215eb0741aa234e7a82bf9c3d10fa8e62bc1049ad5f3",
        block_number=1849245,
        registered_by="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        is_verified_on_chain=True,
        registration_timestamp=now - timedelta(hours=10),
    )

    evidence_3 = EvidenceRecord(
        case_id=case_2.id,
        file_name="pharmacy_cam3_0742utc.png",
        file_size=2380400,
        file_type="image/png",
        file_path="/uploads/pharmacy_cam3_0742utc.png",
        sha256_hash=hash_3,
        on_chain_tx_hash=None, # Unregistered for demo registration workflow!
        block_number=None,
        registered_by="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
        is_verified_on_chain=False,
        registration_timestamp=None,
    )

    db.add(evidence_1)
    db.add(evidence_2)
    db.add(evidence_3)
    db.commit()

    # 5. AI Match Candidates (Run genuine AI Engine evaluation)
    eval_1 = AIMatchingEngine.evaluate_match(
        {
            "description": case_1.description,
            "clothing_description": case_1.clothing_description,
            "identifying_features": case_1.identifying_features,
            "gender": case_1.gender,
            "last_seen_lat": case_1.last_seen_lat,
            "last_seen_lng": case_1.last_seen_lng,
            "last_seen_time": case_1.last_seen_time,
            "last_seen_location_name": case_1.last_seen_location_name,
        },
        {
            "description": sighting_1.description,
            "clothing_observed": sighting_1.clothing_observed,
            "latitude": sighting_1.latitude,
            "longitude": sighting_1.longitude,
            "sighting_time": sighting_1.sighting_time,
        }
    )

    match_1 = AIMatchCandidate(
        case_id=case_1.id,
        sighting_id=sighting_1.id,
        similarity_score=eval_1["similarity_score"],
        textual_similarity=eval_1["textual_similarity"],
        clothing_similarity=eval_1["clothing_similarity"],
        geo_distance_km=eval_1["geo_distance_km"],
        time_diff_hours=eval_1["time_diff_hours"],
        contributing_factors=eval_1["contributing_factors"],
        missing_or_conflicting=eval_1["missing_or_conflicting"],
        review_recommendation=eval_1["review_recommendation"],
        status="Pending Review",
    )

    eval_2 = AIMatchingEngine.evaluate_match(
        {
            "description": case_2.description,
            "clothing_description": case_2.clothing_description,
            "identifying_features": case_2.identifying_features,
            "gender": case_2.gender,
            "last_seen_lat": case_2.last_seen_lat,
            "last_seen_lng": case_2.last_seen_lng,
            "last_seen_time": case_2.last_seen_time,
            "last_seen_location_name": case_2.last_seen_location_name,
        },
        {
            "description": sighting_2.description,
            "clothing_observed": sighting_2.clothing_observed,
            "latitude": sighting_2.latitude,
            "longitude": sighting_2.longitude,
            "sighting_time": sighting_2.sighting_time,
        }
    )

    match_2 = AIMatchCandidate(
        case_id=case_2.id,
        sighting_id=sighting_2.id,
        similarity_score=eval_2["similarity_score"],
        textual_similarity=eval_2["textual_similarity"],
        clothing_similarity=eval_2["clothing_similarity"],
        geo_distance_km=eval_2["geo_distance_km"],
        time_diff_hours=eval_2["time_diff_hours"],
        contributing_factors=eval_2["contributing_factors"],
        missing_or_conflicting=eval_2["missing_or_conflicting"],
        review_recommendation=eval_2["review_recommendation"],
        status="Confirmed Match",
        reviewed_by="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
        reviewer_notes="Confirmed visual match on CCTV still frame. Patient verified safe.",
        reviewed_at=now - timedelta(hours=4),
    )

    db.add(match_1)
    db.add(match_2)
    db.commit()

    # 6. Search Tasks & Volunteer Assignments
    task_1 = SearchTask(
        case_id=case_1.id,
        title="Botanical Gardens Riverbank Grid Sweep",
        description="Search along pedestrian trail between North Gate and pedestrian footbridge. Inspect riverbanks for abandoned items or personal effects.",
        zone_name="Sector Alpha - River Corridor",
        zone_center_lat=37.7755,
        zone_center_lng=-122.4180,
        zone_radius_meters=600.0,
        priority="Urgent",
        status="In Progress",
        created_by="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
    )

    task_2 = SearchTask(
        case_id=case_1.id,
        title="Bayside Pier Commercial CCTV Canvassing",
        description="Interview business operators and collect private external camera recordings facing boardwalk between 19:00 and 22:00.",
        zone_name="Sector Bravo - Pier Commercial",
        zone_center_lat=37.7812,
        zone_center_lng=-122.4101,
        zone_radius_meters=450.0,
        priority="High",
        status="Assigned",
        created_by="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
    )

    task_3 = SearchTask(
        case_id=case_2.id,
        title="Pinecrest Perimeter Residential Canvass",
        description="Knock on doors and check residential porches and gardens within 5-block radius of retirement community.",
        zone_name="Sector Charlie - Pinecrest North",
        zone_center_lat=37.7840,
        zone_center_lng=-122.4175,
        zone_radius_meters=500.0,
        priority="High",
        status="Completed",
        created_by="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
    )

    db.add(task_1)
    db.add(task_2)
    db.add(task_3)
    db.commit()

    assign_1 = VolunteerAssignment(
        task_id=task_1.id,
        volunteer_wallet="0x90f79bf6eb2c4f870365e785982e1f101e93b906".lower(),
        status="In Progress",
        notes="Covering southern bank path with high-visibility vest and flashlight gear.",
    )

    assign_2 = VolunteerAssignment(
        task_id=task_2.id,
        volunteer_wallet="0x15d34aaf54267db7d7c367839aaf71a00a2c6a65".lower(),
        status="Accepted",
        notes="Obtained permission from 2 coffee shops to review entry camera logs.",
    )

    assign_3 = VolunteerAssignment(
        task_id=task_3.id,
        volunteer_wallet="0x90f79bf6eb2c4f870365e785982e1f101e93b906".lower(),
        status="Completed",
        notes="Canvassed 18 residential houses. Sighting led to subject discovery at pharmacy.",
        completed_at=now - timedelta(hours=3),
    )

    db.add(assign_1)
    db.add(assign_2)
    db.add(assign_3)
    db.commit()

    # 7. Audit Events
    audits = [
        AuditEvent(
            case_id=case_1.id,
            actor_wallet="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
            action_type="CASE_CREATED",
            details={"case_number": case_1.case_number, "urgency": "Critical", "title": case_1.title},
            ip_address="127.0.0.1",
        ),
        AuditEvent(
            case_id=case_1.id,
            actor_wallet="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
            action_type="EVIDENCE_REGISTERED_ON_CHAIN",
            details={
                "file_name": evidence_1.file_name,
                "sha256_hash": evidence_1.sha256_hash,
                "block_number": evidence_1.block_number,
            },
            on_chain_tx_hash=evidence_1.on_chain_tx_hash,
            ip_address="127.0.0.1",
        ),
        AuditEvent(
            case_id=case_2.id,
            actor_wallet="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
            action_type="AI_MATCH_CONFIRMED",
            details={"match_id": match_2.id, "similarity_score": match_2.similarity_score},
            ip_address="127.0.0.1",
        ),
        AuditEvent(
            case_id=case_2.id,
            actor_wallet="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
            action_type="STATUS_CHANGED",
            details={"previous_status": "Active Search", "new_status": "Resolved", "reason": "Subject located safe"},
            on_chain_tx_hash="0x528192aefc810482910abefc1829034871928371625489102837461928374612",
            ip_address="127.0.0.1",
        ),
    ]
    for a in audits:
        db.add(a)
    db.commit()
