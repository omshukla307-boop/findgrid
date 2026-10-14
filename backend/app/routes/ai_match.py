from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AIMatchCandidate, MissingPersonCase, Sighting, AuditEvent, Profile
from app.schemas import AIMatchCandidateResponse, AIMatchReviewRequest
from app.auth import require_investigator_or_admin
from app.ai_engine import AIMatchingEngine

router = APIRouter(prefix="/ai", tags=["AI Matching & Explainability"])

@router.get("/candidates", response_model=List[AIMatchCandidateResponse])
def list_ai_candidates(
    case_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    min_score: float = Query(0.0, ge=0.0, le=100.0),
    db: Session = Depends(get_db)
):
    """List AI-flagged candidate matches between reports and sightings with explainable scoring."""
    query = db.query(AIMatchCandidate).filter(AIMatchCandidate.similarity_score >= min_score)

    if case_id:
        query = query.filter(AIMatchCandidate.case_id == case_id)
    if status_filter:
        query = query.filter(AIMatchCandidate.status == status_filter)

    candidates = query.order_by(AIMatchCandidate.similarity_score.desc()).all()

    # Enrich with case and sighting titles
    results = []
    for c in candidates:
        case = db.query(MissingPersonCase).filter(MissingPersonCase.id == c.case_id).first()
        sighting = db.query(Sighting).filter(Sighting.id == c.sighting_id).first()

        resp_item = AIMatchCandidateResponse(
            id=c.id,
            case_id=c.case_id,
            sighting_id=c.sighting_id,
            similarity_score=c.similarity_score,
            textual_similarity=c.textual_similarity,
            clothing_similarity=c.clothing_similarity,
            geo_distance_km=c.geo_distance_km,
            time_diff_hours=c.time_diff_hours,
            contributing_factors=c.contributing_factors or [],
            missing_or_conflicting=c.missing_or_conflicting or [],
            review_recommendation=c.review_recommendation,
            status=c.status,
            reviewed_by=c.reviewed_by,
            reviewer_notes=c.reviewer_notes,
            reviewed_at=c.reviewed_at,
            created_at=c.created_at,
            case_title=case.title if case else None,
            case_person_name=case.missing_person_name if case else None,
            sighting_location=sighting.location_name if sighting else None
        )
        results.append(resp_item)

    return results

@router.post("/candidates/{match_id}/review", response_model=AIMatchCandidateResponse)
def review_ai_match(
    match_id: str,
    review_in: AIMatchReviewRequest,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """
    Investigator review decision on an AI candidate match.
    Enforces human-in-the-loop oversight before confirming or rejecting potential correlations.
    """
    match_record = db.query(AIMatchCandidate).filter(AIMatchCandidate.id == match_id).first()
    if not match_record:
        raise HTTPException(status_code=404, detail="AI candidate match record not found.")

    match_record.status = review_in.status
    match_record.reviewer_notes = review_in.reviewer_notes
    match_record.reviewed_by = current_user.wallet_address
    match_record.reviewed_at = datetime.now(timezone.utc)

    # Cascading status updates upon confirmation
    case = db.query(MissingPersonCase).filter(MissingPersonCase.id == match_record.case_id).first()
    sighting = db.query(Sighting).filter(Sighting.id == match_record.sighting_id).first()

    if review_in.status == "Confirmed Match":
        if sighting:
            sighting.status = "Verified"
            sighting.investigator_notes = f"Corroborated by AI match analysis ({match_record.similarity_score}%) and verified by {current_user.wallet_address[:8]}"
        if case and case.status in ["Submitted", "Under Review"]:
            case.status = "Potential Match"

        audit = AuditEvent(
            case_id=match_record.case_id,
            actor_wallet=current_user.wallet_address,
            action_type="AI_MATCH_CONFIRMED",
            details={
                "match_id": match_record.id,
                "similarity_score": match_record.similarity_score,
                "sighting_id": match_record.sighting_id,
                "reviewer_notes": review_in.reviewer_notes,
            }
        )
        db.add(audit)

    elif review_in.status == "Rejected":
        if sighting and sighting.status == "Under Review":
            sighting.status = "Rejected"

        audit = AuditEvent(
            case_id=match_record.case_id,
            actor_wallet=current_user.wallet_address,
            action_type="AI_MATCH_REJECTED",
            details={
                "match_id": match_record.id,
                "similarity_score": match_record.similarity_score,
                "reviewer_notes": review_in.reviewer_notes,
            }
        )
        db.add(audit)

    db.commit()
    db.refresh(match_record)

    return AIMatchCandidateResponse(
        id=match_record.id,
        case_id=match_record.case_id,
        sighting_id=match_record.sighting_id,
        similarity_score=match_record.similarity_score,
        textual_similarity=match_record.textual_similarity,
        clothing_similarity=match_record.clothing_similarity,
        geo_distance_km=match_record.geo_distance_km,
        time_diff_hours=match_record.time_diff_hours,
        contributing_factors=match_record.contributing_factors or [],
        missing_or_conflicting=match_record.missing_or_conflicting or [],
        review_recommendation=match_record.review_recommendation,
        status=match_record.status,
        reviewed_by=match_record.reviewed_by,
        reviewer_notes=match_record.reviewer_notes,
        reviewed_at=match_record.reviewed_at,
        created_at=match_record.created_at,
        case_title=case.title if case else None,
        case_person_name=case.missing_person_name if case else None,
        sighting_location=sighting.location_name if sighting else None
    )

@router.post("/re-evaluate")
def re_evaluate_all_cases(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """Batch re-evaluate all active cases against all sightings using updated similarity thresholds."""
    cases = db.query(MissingPersonCase).filter(
        MissingPersonCase.status.in_(["Submitted", "Under Review", "Active Search", "Potential Match"])
    ).all()
    sightings = db.query(Sighting).all()

    new_matches_count = 0
    for c in cases:
        for s in sightings:
            # Check if match already exists
            existing = db.query(AIMatchCandidate).filter(
                AIMatchCandidate.case_id == c.id,
                AIMatchCandidate.sighting_id == s.id
            ).first()

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
                    "description": s.description,
                    "clothing_observed": s.clothing_observed,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "sighting_time": s.sighting_time,
                }
            )

            if eval_result["similarity_score"] >= 35.0:
                if existing:
                    existing.similarity_score = eval_result["similarity_score"]
                    existing.textual_similarity = eval_result["textual_similarity"]
                    existing.clothing_similarity = eval_result["clothing_similarity"]
                    existing.geo_distance_km = eval_result["geo_distance_km"]
                    existing.time_diff_hours = eval_result["time_diff_hours"]
                    existing.contributing_factors = eval_result["contributing_factors"]
                    existing.missing_or_conflicting = eval_result["missing_or_conflicting"]
                    existing.review_recommendation = eval_result["review_recommendation"]
                else:
                    new_match = AIMatchCandidate(
                        case_id=c.id,
                        sighting_id=s.id,
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
                    db.add(new_match)
                    new_matches_count += 1

    db.commit()
    return {"message": "AI matching re-evaluation completed successfully.", "new_matches_flagged": new_matches_count}
