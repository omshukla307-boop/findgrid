from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SearchTask, VolunteerAssignment, Profile, MissingPersonCase, AuditEvent
from app.schemas import (
    SearchTaskCreate, SearchTaskUpdate, SearchTaskResponse,
    VolunteerAssignmentCreate, VolunteerAssignmentResponse, ProfileResponse
)
from app.auth import get_current_user, require_investigator_or_admin, require_authenticated

router = APIRouter(prefix="/volunteers", tags=["Volunteer & Search Coordination"])

@router.get("", response_model=List[ProfileResponse])
def list_volunteers(
    role: Optional[str] = Query("volunteer"),
    db: Session = Depends(get_db)
):
    """List approved search volunteers and field personnel."""
    query = db.query(Profile)
    if role:
        query = query.filter(Profile.role == role)
    return query.filter(Profile.is_active == True).all()

@router.get("/tasks", response_model=List[SearchTaskResponse])
def list_search_tasks(
    case_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """List search operations, grid sectors, and active assignments."""
    query = db.query(SearchTask)
    if case_id:
        query = query.filter(SearchTask.case_id == case_id)
    if status_filter:
        query = query.filter(SearchTask.status == status_filter)

    return query.order_by(SearchTask.created_at.desc()).all()

@router.post("/tasks", response_model=SearchTaskResponse)
def create_search_task(
    task_in: SearchTaskCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """Create a new search sector task or canvas mission for field volunteers."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.id == task_in.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Associated case not found.")

    task = SearchTask(
        case_id=task_in.case_id,
        title=task_in.title,
        description=task_in.description,
        zone_name=task_in.zone_name,
        zone_center_lat=task_in.zone_center_lat,
        zone_center_lng=task_in.zone_center_lng,
        zone_radius_meters=task_in.zone_radius_meters,
        priority=task_in.priority,
        status="Open",
        created_by=current_user.wallet_address,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    audit = AuditEvent(
        case_id=task.case_id,
        actor_wallet=current_user.wallet_address,
        action_type="SEARCH_TASK_CREATED",
        details={
            "task_id": task.id,
            "title": task.title,
            "zone_name": task.zone_name,
            "priority": task.priority,
        }
    )
    db.add(audit)
    db.commit()

    return task

@router.put("/tasks/{task_id}", response_model=SearchTaskResponse)
def update_search_task(
    task_id: str,
    update_in: SearchTaskUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_authenticated)
):
    """Update task progress or completion status."""
    task = db.query(SearchTask).filter(SearchTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Search task not found.")

    update_dict = update_in.model_dump(exclude_unset=True)
    for key, val in update_dict.items():
        setattr(task, key, val)

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)

    return task

@router.post("/tasks/{task_id}/assign", response_model=VolunteerAssignmentResponse)
def assign_volunteer(
    task_id: str,
    assign_in: VolunteerAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_authenticated)
):
    """Assign a volunteer wallet to a designated search task."""
    task = db.query(SearchTask).filter(SearchTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Search task not found.")

    # Check for existing assignment
    norm_wallet = assign_in.volunteer_wallet.lower()
    existing = db.query(VolunteerAssignment).filter(
        VolunteerAssignment.task_id == task_id,
        VolunteerAssignment.volunteer_wallet == norm_wallet
    ).first()

    if existing:
        return existing

    assignment = VolunteerAssignment(
        task_id=task_id,
        volunteer_wallet=norm_wallet,
        status="Assigned",
        notes=assign_in.notes or "Assigned by incident coordinator",
    )
    db.add(assignment)

    if task.status == "Open":
        task.status = "Assigned"

    db.commit()
    db.refresh(assignment)

    return assignment

@router.put("/assignments/{assignment_id}", response_model=VolunteerAssignmentResponse)
def update_assignment_status(
    assignment_id: str,
    status_str: str = Query(..., pattern="^(Assigned|Accepted|In Progress|Completed|Declined)$"),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_authenticated)
):
    """Update assignment status (e.g. In Progress, Completed)."""
    assignment = db.query(VolunteerAssignment).filter(VolunteerAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Volunteer assignment not found.")

    assignment.status = status_str
    if notes:
        assignment.notes = notes
    if status_str == "Completed":
        assignment.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(assignment)
    return assignment
