from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AuditEvent
from app.schemas import AuditEventResponse

router = APIRouter(prefix="/audit", tags=["Tamper-Evident Audit Trail"])

@router.get("", response_model=List[AuditEventResponse])
def list_audit_events(
    case_id: Optional[str] = Query(None),
    actor_wallet: Optional[str] = Query(None),
    action_type: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve immutable chronological audit records of system activities, status shifts, and blockchain receipts."""
    query = db.query(AuditEvent)

    if case_id:
        query = query.filter(AuditEvent.case_id == case_id)
    if actor_wallet:
        query = query.filter(AuditEvent.actor_wallet == actor_wallet.lower())
    if action_type:
        query = query.filter(AuditEvent.action_type == action_type)

    return query.order_by(AuditEvent.created_at.desc()).offset(skip).limit(limit).all()
