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
            full_name="Sujal Das",
            email="sujal.das@groundpatrol.org",
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
            full_name="Sujal Das",
            email="citizen@findgrid.org",
            organization="FindGrid Search & Emergency Rescue Network",
            badge_number="CIT-IND-88129",
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

    # Clean up legacy non-Bhilai demonstration cases if present
    legacy_case = db.query(MissingPersonCase).filter(MissingPersonCase.missing_person_name == "Maya Lin").first()
    if legacy_case:
        # Clear legacy synthetic demo records
        db.query(AIMatchCandidate).delete()
        db.query(VolunteerAssignment).delete()
        db.query(SearchTask).delete()
        db.query(EvidenceRecord).delete()
        db.query(Sighting).delete()
        db.query(AuditEvent).delete()
        db.query(MissingPersonCase).delete()
        db.commit()

    # Check if database cases are already seeded with Bhilai cases
    if db.query(MissingPersonCase).filter(MissingPersonCase.missing_person_name == "P Yash Kumar").count() > 0:
        return

    now = datetime.now(timezone.utc)

    # 2. Missing Person Cases (Bhilai, Chhattisgarh Regional Grid)
    case_1 = MissingPersonCase(
        case_number="FG-2026-0901",
        title="Disappearance near Civic Centre Sector 6, Bhilai",
        missing_person_name="P Yash Kumar",
        age=21,
        gender="Male",
        description="Engineering student at Bhilai Institute. Last seen leaving study session near Kala Mandir, Civic Centre. Height 5'9\", athletic build, dark hair, wearing black spectacles.",
        clothing_description="Navy blue hoodie with dark sleeves, black denim jeans, white sneakers, carrying a black laptop backpack.",
        identifying_features="Small birthmark on right wrist, wears stainless steel watch, black-rimmed glasses.",
        last_seen_time=now - timedelta(hours=14),
        last_seen_location_name="Civic Centre, Sector 6, Bhilai",
        last_seen_lat=21.1950,
        last_seen_lng=81.3560,
        status="Active Search",
        urgency="Critical",
        reporter_name="Sujal Das",
        reporter_contact="+91 98271-44021",
        reporter_relationship="Friend / Batchmate",
        assigned_investigator_wallet="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80",
    )

    case_2 = MissingPersonCase(
        case_number="FG-2026-0902",
        title="Disappearance near Nehru Nagar Chowk, Bhilai",
        missing_person_name="Aditya Lamte",
        age=22,
        gender="Male",
        description="Young software developer. Did not return after an evening walk towards GE Road flyover. Height 5'11\", medium build, short black hair, clean-shaven.",
        clothing_description="Maroon round-neck sweatshirt, beige cargo trousers, dark brown running shoes.",
        identifying_features="Scar on left forearm from sports injury, wears a silver kada on right wrist.",
        last_seen_time=now - timedelta(hours=6),
        last_seen_location_name="Nehru Nagar Chowk, GE Road, Bhilai",
        last_seen_lat=21.2185,
        last_seen_lng=81.3280,
        status="Under Review",
        urgency="High",
        reporter_name="Ramesh Lamte",
        reporter_contact="+91 94252-88190",
        reporter_relationship="Father",
        assigned_investigator_wallet="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
        is_sensitive=False,
        primary_image_url="/images/aditya_lamte.jpg",
    )

    case_3 = MissingPersonCase(
        case_number="FG-2026-0903",
        title="Reported Missing from Supela Market Corridor, Bhilai",
        missing_person_name="Sankalp Dewangan",
        age=20,
        gender="Male",
        description="Undergraduate student. Disappeared near Akash Ganga commercial complex after running evening errands. Height 5'8\", lean build, wavy black hair.",
        clothing_description="Black collared casual shirt, olive green chinos, black sneakers, carrying blue canvas messenger bag.",
        identifying_features="Distinctive mole on left cheek, wears black sports digital watch.",
        last_seen_time=now - timedelta(days=2),
        last_seen_location_name="Supela Clock Tower / Akash Ganga, Bhilai",
        last_seen_lat=21.2050,
        last_seen_lng=81.3410,
        status="Potential Match",
        urgency="High",
        reporter_name="Tapan Dewangan",
        reporter_contact="+91 98930-11234",
        reporter_relationship="Brother",
        assigned_investigator_wallet="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1615813967515-e1838c1c5116?auto=format&fit=crop&w=600&q=80",
    )

    case_4 = MissingPersonCase(
        case_number="FG-2026-0904",
        title="Separation near Junwani Commercial Corridor, Bhilai",
        missing_person_name="Ayush Lamte",
        age=19,
        gender="Male",
        description="First-year student separated from friends after university fest event near Junwani. Height 5'10\", slim build, dark eyes, polite demeanor.",
        clothing_description="Teal polo t-shirt, dark gray track pants, white sports shoes with orange accents.",
        identifying_features="Small scar near hairline, carries red metallic water bottle.",
        last_seen_time=now - timedelta(days=4),
        last_seen_location_name="Junwani Commercial Square, Bhilai",
        last_seen_lat=21.2330,
        last_seen_lng=81.3120,
        status="Submitted",
        urgency="Medium",
        reporter_name="Sunita Lamte",
        reporter_contact="+91 97555-77312",
        reporter_relationship="Mother",
        assigned_investigator_wallet="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".lower(),
        is_sensitive=False,
        primary_image_url="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?auto=format&fit=crop&w=600&q=80",
    )

    db.add(case_1)
    db.add(case_2)
    db.add(case_3)
    db.add(case_4)
    db.commit()

    # 3. Sightings (Bhilai Regional Landmarks)
    sighting_1 = Sighting(
        case_id=case_1.id,
        sighting_time=case_1.last_seen_time + timedelta(hours=2, minutes=15),
        location_name="Sector 9 Hospital Gate Road, Bhilai",
        latitude=21.1890,
        longitude=81.3620,
        description="Young man matching P Yash Kumar description observed near Sector 9 gate tea stall. Looked fatigued, carried black backpack.",
        clothing_observed="Navy blue hoodie, dark jeans, white sneakers.",
        reporter_wallet="0x90f79bf6eb2c4f870365e785982e1f101e93b906".lower(),
        reporter_name="Sujal Das (Ground Volunteer)",
        reporter_contact="+91 98270-11223",
        status="Under Review",
        investigator_notes="High spatial correlation with Case FG-2026-0901. Hospital gate CCTV requested.",
    )

    sighting_2 = Sighting(
        case_id=case_2.id,
        sighting_time=case_2.last_seen_time + timedelta(hours=1, minutes=30),
        location_name="Surya Treasure Island Mall Entrance, Bhilai",
        latitude=21.2220,
        longitude=81.3250,
        description="Young man in maroon sweatshirt observed walking towards auto stand outside Surya Mall.",
        clothing_observed="Maroon sweatshirt, beige cargo pants, brown shoes.",
        reporter_wallet="0x15d34aaf54267db7d7c367839aaf71a00a2c6a65".lower(),
        reporter_name="Priya Sharma (Volunteer)",
        reporter_contact="+91 94241-99881",
        status="Verified",
        investigator_notes="Confirmed visual match by traffic warden. Search team deployed.",
    )

    sighting_3 = Sighting(
        case_id=case_3.id,
        sighting_time=case_3.last_seen_time + timedelta(hours=3),
        location_name="Power House Railway Station Terminal, Bhilai",
        latitude=21.2010,
        longitude=81.3680,
        description="Youth seen conversing with passengers near platform ticket counter. Had messenger bag and black casual shirt.",
        clothing_observed="Black collared shirt, olive chinos, sneakers.",
        reporter_wallet=None,
        reporter_name="Anonymous Citizen",
        reporter_contact="+91 98110-23456",
        status="Submitted",
        investigator_notes="Potential match identified by AI engine. Under initial investigator triage.",
    )

    sighting_4 = Sighting(
        case_id=case_4.id,
        sighting_time=case_4.last_seen_time + timedelta(hours=4),
        location_name="BIT Durg Campus North Gate, Junwani, Bhilai",
        latitude=21.2370,
        longitude=81.3100,
        description="Student in teal polo shirt observed waiting near bus shelter carrying metallic water bottle.",
        clothing_observed="Teal polo t-shirt, dark gray track pants.",
        reporter_wallet="0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f".lower(),
        reporter_name="Sujal Das",
        reporter_contact="citizen@findgrid.org",
        status="Under Review",
        investigator_notes="Cross-verified with university security patrol.",
    )

    db.add(sighting_1)
    db.add(sighting_2)
    db.add(sighting_3)
    db.add(sighting_4)
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
        title="Civic Centre to Kala Mandir Grid Sweep",
        description="Search along pedestrian corridors between Civic Centre Park, Kala Mandir, and Sector 6 market. Inspect for abandoned items or personal effects.",
        zone_name="Sector 6 - Civic Centre Perimeter",
        zone_center_lat=21.1950,
        zone_center_lng=81.3560,
        zone_radius_meters=600.0,
        priority="Urgent",
        status="In Progress",
        created_by="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
    )

    task_2 = SearchTask(
        case_id=case_2.id,
        title="Nehru Nagar to Surya Mall Canvassing",
        description="Interview local business operators and collect private external camera recordings facing GE Road between 19:00 and 22:00.",
        zone_name="Sector 2 - Nehru Nagar Corridor",
        zone_center_lat=21.2185,
        zone_center_lng=81.3280,
        zone_radius_meters=500.0,
        priority="High",
        status="Assigned",
        created_by="0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
    )

    task_3 = SearchTask(
        case_id=case_3.id,
        title="Supela Market & Akash Ganga Canvass",
        description="Check shops, transit auto stand, and commercial corridors around Supela Clock Tower.",
        zone_name="Sector 3 - Akash Ganga Commercial",
        zone_center_lat=21.2050,
        zone_center_lng=81.3410,
        zone_radius_meters=450.0,
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
