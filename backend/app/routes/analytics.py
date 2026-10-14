from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    MissingPersonCase, Sighting, AIMatchCandidate,
    SearchTask, EvidenceRecord, AuditEvent
)
from app.schemas import AnalyticsResponse

router = APIRouter(prefix="/analytics", tags=["Operational Analytics"])

@router.get("/overview", response_model=AnalyticsResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Calculate real-time operational statistics directly from database records.
    Powers dashboard KPIs, severity distribution charts, and search progress metrics.
    """
    # 1. Total active cases
    total_active_cases = db.query(MissingPersonCase).filter(
        MissingPersonCase.status.in_(["Active Search", "Potential Match", "Under Review"])
    ).count()

    # 2. Cases awaiting review
    cases_awaiting_review = db.query(MissingPersonCase).filter(
        MissingPersonCase.status.in_(["Submitted", "Under Review"])
    ).count()

    # 3. Total sightings & sightings under review
    total_sightings = db.query(Sighting).count()
    sightings_under_review = db.query(Sighting).filter(
        Sighting.status.in_(["Submitted", "Under Review"])
    ).count()

    # 4. Potential matches pending review
    potential_matches_pending = db.query(AIMatchCandidate).filter(
        AIMatchCandidate.status == "Pending Review"
    ).count()

    # 5. Cases resolved
    cases_resolved = db.query(MissingPersonCase).filter(
        MissingPersonCase.status == "Resolved"
    ).count()

    # 6. Volunteer tasks in progress
    tasks_in_progress = db.query(SearchTask).filter(
        SearchTask.status.in_(["In Progress", "Assigned"])
    ).count()

    # 7. Evidence counts
    total_evidence_files = db.query(EvidenceRecord).count()
    blockchain_verified_count = db.query(EvidenceRecord).filter(
        EvidenceRecord.is_verified_on_chain == True
    ).count()

    # 8. Urgency distribution
    urgency_counts = (
        db.query(MissingPersonCase.urgency, func.count(MissingPersonCase.id))
        .group_by(MissingPersonCase.urgency)
        .all()
    )
    urgency_map = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for u, count in urgency_counts:
        if u in urgency_map:
            urgency_map[u] = count

    # 9. Status distribution
    status_counts = (
        db.query(MissingPersonCase.status, func.count(MissingPersonCase.id))
        .group_by(MissingPersonCase.status)
        .all()
    )
    status_map = {
        "Active Search": 0,
        "Under Review": 0,
        "Potential Match": 0,
        "Resolved": 0,
        "Submitted": 0,
        "Archived": 0,
    }
    for s, count in status_counts:
        if s in status_map:
            status_map[s] = count

    # 10. Recent activity feed
    recent_audits = (
        db.query(AuditEvent)
        .order_by(AuditEvent.created_at.desc())
        .limit(10)
        .all()
    )
    activity_feed = [
        {
            "id": a.id,
            "action": a.action_type,
            "actor": a.actor_wallet,
            "details": a.details,
            "timestamp": a.created_at.isoformat(),
            "tx_hash": a.on_chain_tx_hash
        }
        for a in recent_audits
    ]

    return AnalyticsResponse(
        total_active_cases=total_active_cases,
        cases_awaiting_review=cases_awaiting_review,
        total_sightings=total_sightings,
        sightings_under_review=sightings_under_review,
        potential_matches_pending=potential_matches_pending,
        cases_resolved=cases_resolved,
        tasks_in_progress=tasks_in_progress,
        total_evidence_files=total_evidence_files,
        blockchain_verified_count=blockchain_verified_count,
        urgency_distribution=urgency_map,
        status_distribution=status_map,
        recent_activity=activity_feed,
    )
