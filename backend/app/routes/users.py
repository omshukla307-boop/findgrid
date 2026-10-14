from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Profile, AuditEvent
from app.schemas import ProfileResponse, ProfileUpdate
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["User & Role Management"])

@router.get("", response_model=List[ProfileResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: Profile = Depends(get_current_user)
):
    """List registered users, investigators, and volunteers."""
    return db.query(Profile).order_by(Profile.created_at.desc()).all()

@router.put("/{user_id}", response_model=ProfileResponse)
def update_user_role_or_profile(
    user_id: str,
    update_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_admin)
):
    """Update user role, organization, or badge number (Admin only)."""
    target_user = db.query(Profile).filter(Profile.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    update_dict = update_in.model_dump(exclude_unset=True)
    previous_role = target_user.role

    for key, val in update_dict.items():
        setattr(target_user, key, val)

    db.commit()
    db.refresh(target_user)

    # Log audit event
    audit = AuditEvent(
        actor_wallet=current_user.wallet_address,
        action_type="USER_ROLE_UPDATED",
        details={
            "target_wallet": target_user.wallet_address,
            "previous_role": previous_role,
            "new_role": target_user.role
        }
    )
    db.add(audit)
    db.commit()

    return target_user
