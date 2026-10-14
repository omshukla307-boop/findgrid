import random
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import MissingPersonCase, Sighting, EvidenceRecord, SearchTask, AuditEvent, Profile
from app.schemas import CaseCreate, CaseUpdate, CaseResponse
from app.auth import get_current_user, get_current_user_optional, require_investigator_or_admin

router = APIRouter(prefix="/cases", tags=["Missing Person Cases"])

def generate_case_number(db: Session) -> str:
    year = datetime.now().year
    count = db.query(MissingPersonCase).count() + 1
    return f"FG-{year}-{count:04d}"

@router.get("", response_model=List[CaseResponse])
def list_cases(
    q: Optional[str] = Query(None, description="Search term for title, name, or description"),
    status_filter: Optional[str] = Query(None, alias="status"),
    urgency_filter: Optional[str] = Query(None, alias="urgency"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_current_user_optional)
):
    """List missing person cases with optional search and filter criteria. Respects privacy controls."""
    query = db.query(MissingPersonCase)

    # Privacy filter: non-investigators cannot view sensitive cases
    is_authorized = current_user and current_user.role in ["admin", "investigator"]
    if not is_authorized:
        query = query.filter(MissingPersonCase.is_sensitive == False)

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                MissingPersonCase.title.ilike(search_pattern),
                MissingPersonCase.missing_person_name.ilike(search_pattern),
                MissingPersonCase.description.ilike(search_pattern),
                MissingPersonCase.case_number.ilike(search_pattern),
                MissingPersonCase.last_seen_location_name.ilike(search_pattern),
            )
        )

    if status_filter:
        query = query.filter(MissingPersonCase.status == status_filter)

    if urgency_filter:
        query = query.filter(MissingPersonCase.urgency == urgency_filter)

    cases = query.order_by(MissingPersonCase.created_at.desc()).offset(skip).limit(limit).all()

    # Redact reporter sensitive contact if not authorized
    if not is_authorized:
        for c in cases:
            c.reporter_contact = "[RESTRICTED - AUTHORIZED ONLY]"
            c.reporter_name = "[RESTRICTED]"

    return cases

@router.post("", response_model=CaseResponse)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_current_user_optional)
):
    """Create a new missing person case complaint/report (Citizens, Volunteers, Investigators & Admins)."""
    if not current_user:
        wallet_addr = "0x4b7f8e12a67e456d98124d65f7fbc0abf5b21e8f".lower()
        current_user = db.query(Profile).filter(Profile.wallet_address == wallet_addr).first()
        if not current_user:
            current_user = Profile(
                wallet_address=wallet_addr,
                full_name=case_in.reporter_name or "Sujal Das",
                email=case_in.reporter_contact or "sujal.das@findgrid.org",
                role="volunteer",
                organization="FindGrid Search & Emergency Rescue Network",
                badge_number="CIT-IND-2026-88129",
                password_hash=hash_password("Password123!"),
                is_active=True
            )
            try:
                db.add(current_user)
                db.commit()
                db.refresh(current_user)
            except Exception:
                db.rollback()
                current_user = db.query(Profile).filter(Profile.wallet_address == wallet_addr).first()

    case_num = case_in.case_number or generate_case_number(db)

    # If submitted by citizen or volunteer, mark as Submitted; if investigator/admin, Under Review
    initial_status = "Under Review" if current_user.role in ["investigator", "admin"] else "Submitted"
    assigned_inv = current_user.wallet_address if current_user.role in ["investigator", "admin"] else None

    new_case = MissingPersonCase(
        case_number=case_num,
        title=case_in.title,
        missing_person_name=case_in.missing_person_name,
        age=case_in.age,
        gender=case_in.gender,
        description=case_in.description,
        clothing_description=case_in.clothing_description,
        identifying_features=case_in.identifying_features,
        last_seen_time=case_in.last_seen_time,
        last_seen_location_name=case_in.last_seen_location_name,
        last_seen_lat=case_in.last_seen_lat,
        last_seen_lng=case_in.last_seen_lng,
        urgency=case_in.urgency or "Medium",
        reporter_name=case_in.reporter_name or current_user.full_name or "Verified Citizen",
        reporter_contact=case_in.reporter_contact or current_user.email or "Contact on File",
        reporter_relationship=case_in.reporter_relationship or "Family / Citizen Informant",
        assigned_investigator_wallet=assigned_inv,
        is_sensitive=case_in.is_sensitive,
        primary_image_url=case_in.primary_image_url,
        status=initial_status,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Log audit record
    audit = AuditEvent(
        case_id=new_case.id,
        actor_wallet=current_user.wallet_address,
        action_type="CITIZEN_COMPLAINT_FILED" if current_user.role not in ["investigator", "admin"] else "CASE_CREATED",
        details={
            "case_number": new_case.case_number,
            "title": new_case.title,
            "urgency": new_case.urgency,
            "reporter_name": new_case.reporter_name,
            "initial_status": new_case.status
        }
    )
    db.add(audit)
    db.commit()

    return new_case

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_current_user_optional)
):
    """Get single case details with authorization check."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Missing person case not found.")

    is_authorized = current_user and current_user.role in ["admin", "investigator"]
    if case.is_sensitive and not is_authorized:
        raise HTTPException(
            status_code=403,
            detail="Access restricted: This case record contains protected sensitive data."
        )

    if not is_authorized:
        case.reporter_contact = "[RESTRICTED - AUTHORIZED ONLY]"
        case.reporter_name = "[RESTRICTED]"

    return case

@router.put("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    case_in: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """Update case status or attributes with audit logging."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Missing person case not found.")

    update_dict = case_in.model_dump(exclude_unset=True)
    previous_status = case.status

    for key, val in update_dict.items():
        setattr(case, key, val)

    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)

    # If status changed, record audit event
    if "status" in update_dict and update_dict["status"] != previous_status:
        audit = AuditEvent(
            case_id=case.id,
            actor_wallet=current_user.wallet_address,
            action_type="STATUS_CHANGED",
            details={
                "previous_status": previous_status,
                "new_status": case.status,
                "reason": "Authorized investigator update"
            }
        )
        db.add(audit)
        db.commit()

    return case

@router.get("/{case_id}/timeline")
def get_case_timeline(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_current_user_optional)
):
    """Chronological timeline aggregating case creation, sightings, evidence, tasks, and audit logs."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    timeline = []

    # Case Creation
    timeline.append({
        "type": "CASE_CREATED",
        "title": "Case File Opened",
        "timestamp": case.created_at.isoformat(),
        "actor": case.assigned_investigator_wallet or "Incident Command",
        "details": f"Missing person report initiated for {case.missing_person_name} ({case.case_number}). Urgency: {case.urgency}."
    })

    # Sightings
    sightings = db.query(Sighting).filter(Sighting.case_id == case_id).all()
    for s in sightings:
        timeline.append({
            "type": "SIGHTING_SUBMITTED",
            "title": f"Sighting Reported: {s.location_name}",
            "timestamp": s.sighting_time.isoformat(),
            "actor": s.reporter_wallet or s.reporter_name or "Anonymous",
            "details": s.description,
            "status": s.status
        })

    # Evidence Records
    evidence_records = db.query(EvidenceRecord).filter(EvidenceRecord.case_id == case_id).all()
    for e in evidence_records:
        timeline.append({
            "type": "EVIDENCE_UPLOADED",
            "title": f"Evidence Secured: {e.file_name}",
            "timestamp": e.created_at.isoformat(),
            "actor": e.registered_by,
            "details": f"SHA-256: {e.sha256_hash[:16]}... On-Chain Status: {'Verified' if e.is_verified_on_chain else 'Pending'}"
        })

    # Audit Events
    audits = db.query(AuditEvent).filter(AuditEvent.case_id == case_id).all()
    for a in audits:
        if a.action_type not in ["CASE_CREATED"]:
            timeline.append({
                "type": a.action_type,
                "title": f"Audit: {a.action_type.replace('_', ' ').title()}",
                "timestamp": a.created_at.isoformat(),
                "actor": a.actor_wallet,
                "details": str(a.details)
            })

    # Sort chronological
    timeline.sort(key=lambda x: x["timestamp"])
    return timeline
