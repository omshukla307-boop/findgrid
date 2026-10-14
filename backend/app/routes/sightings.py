from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Sighting, MissingPersonCase, AIMatchCandidate, AuditEvent, Profile
from app.schemas import SightingCreate, SightingUpdate, SightingResponse
from app.auth import get_current_user_optional, require_investigator_or_admin
from app.ai_engine import AIMatchingEngine

router = APIRouter(prefix="/sightings", tags=["Sightings & Crowdsourcing"])

@router.get("", response_model=List[SightingResponse])
def list_sightings(
    case_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """Retrieve submitted sightings, optionally filtered by case or verification status."""
    query = db.query(Sighting)
    if case_id:
        query = query.filter(Sighting.case_id == case_id)
    if status_filter:
        query = query.filter(Sighting.status == status_filter)

    return query.order_by(Sighting.created_at.desc()).all()

@router.post("", response_model=SightingResponse)
def submit_sighting(
    sighting_in: SightingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_current_user_optional)
):
    """
    Submit a missing person sighting report.
    Automatically triggers AI similarity evaluation against relevant cases and flags candidate matches.
    """
    reporter_wallet = current_user.wallet_address if current_user else None

    new_sighting = Sighting(
        case_id=sighting_in.case_id,
        sighting_time=sighting_in.sighting_time,
        location_name=sighting_in.location_name,
        latitude=sighting_in.latitude,
        longitude=sighting_in.longitude,
        description=sighting_in.description,
        clothing_observed=sighting_in.clothing_observed,
        reporter_wallet=reporter_wallet,
        reporter_name=sighting_in.reporter_name or (current_user.full_name if current_user else "Anonymous Citizen"),
        reporter_contact=sighting_in.reporter_contact,
        status="Submitted",
    )
    db.add(new_sighting)
    db.commit()
    db.refresh(new_sighting)

    # Automated AI Proximity & Similarity Analysis
    cases_to_compare = []
    if new_sighting.case_id:
        c = db.query(MissingPersonCase).filter(MissingPersonCase.id == new_sighting.case_id).first()
        if c:
            cases_to_compare.append(c)
    else:
        # Compare against all open active cases
        cases_to_compare = db.query(MissingPersonCase).filter(
            MissingPersonCase.status.in_(["Submitted", "Under Review", "Active Search", "Potential Match"])
        ).all()

    for c in cases_to_compare:
        eval_result = AIMatchingEngine.evaluate_match(
            {
                "description": c.description,
                "clothing_description": c.clothing_description,
                "identifying_features": c.identifying_features,
                "gender": c.gender,
                "last_seen_lat": c.last_seen_lat,
                "last_seen_lng": c.last_seen_lng,
                "last_seen_time": c.last_seen_time,
                "last_seen_location_name": c.last_seen_location_name,
            },
            {
                "description": new_sighting.description,
                "clothing_observed": new_sighting.clothing_observed,
                "latitude": new_sighting.latitude,
                "longitude": new_sighting.longitude,
                "sighting_time": new_sighting.sighting_time,
            }
        )

        # Record candidate match if threshold >= 35.0%
        if eval_result["similarity_score"] >= 35.0:
            match_cand = AIMatchCandidate(
                case_id=c.id,
                sighting_id=new_sighting.id,
                similarity_score=eval_result["similarity_score"],
                textual_similarity=eval_result["textual_similarity"],
                clothing_similarity=eval_result["clothing_similarity"],
                geo_distance_km=eval_result["geo_distance_km"],
                time_diff_hours=eval_result["time_diff_hours"],
                contributing_factors=eval_result["contributing_factors"],
                missing_or_conflicting=eval_result["missing_or_conflicting"],
                review_recommendation=eval_result["review_recommendation"],
                status="Pending Review",
            )
            db.add(match_cand)

            if eval_result["similarity_score"] >= 70.0:
                audit = AuditEvent(
                    case_id=c.id,
                    actor_wallet=reporter_wallet or "SYSTEM_AI_ENGINE",
                    action_type="HIGH_PROBABILITY_AI_MATCH_GENERATED",
                    details={
                        "sighting_id": new_sighting.id,
                        "similarity_score": eval_result["similarity_score"],
                        "geo_distance_km": eval_result["geo_distance_km"],
                    }
                )
                db.add(audit)

    db.commit()
    return new_sighting

@router.put("/{sighting_id}", response_model=SightingResponse)
def update_sighting(
    sighting_id: str,
    update_in: SightingUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """Investigator review and status update for submitted sightings."""
    sighting = db.query(Sighting).filter(Sighting.id == sighting_id).first()
    if not sighting:
        raise HTTPException(status_code=404, detail="Sighting report not found.")

    if update_in.status:
        sighting.status = update_in.status
    if update_in.investigator_notes:
        sighting.investigator_notes = update_in.investigator_notes

    db.commit()
    db.refresh(sighting)

    # Log audit event
    audit = AuditEvent(
        case_id=sighting.case_id,
        actor_wallet=current_user.wallet_address,
        action_type="SIGHTING_REVIEWED",
        details={
            "sighting_id": sighting.id,
            "new_status": sighting.status,
            "notes": sighting.investigator_notes,
        }
    )
    db.add(audit)
    db.commit()

    return sighting
