from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Profile, AuthenticationNonce, AuditEvent
from app.schemas import (
    NonceRequest, NonceResponse, VerifySignatureRequest,
    AuthTokenResponse, DemoLoginRequest, ProfileResponse
)
from app.auth import (
    generate_nonce, verify_metamask_signature, create_access_token,
    get_auth_message, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/nonce", response_model=NonceResponse)
def request_nonce(req: NonceRequest, db: Session = Depends(get_db)):
    """Generate a single-use cryptographically secure challenge nonce for MetaMask authentication."""
    if not req.wallet_address.startswith("0x") or len(req.wallet_address) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum wallet address format. Must be 42 characters starting with 0x."
        )

    nonce_record = generate_nonce(req.wallet_address, db)
    message = get_auth_message(nonce_record.nonce)

    return NonceResponse(
        wallet_address=nonce_record.wallet_address,
        nonce=nonce_record.nonce,
        message=message,
        expires_at=nonce_record.expires_at
    )

@router.post("/verify", response_model=AuthTokenResponse)
def verify_signature(req: VerifySignatureRequest, db: Session = Depends(get_db)):
    """Verify MetaMask cryptographic signature on the nonce challenge and issue a JWT session token."""
    profile = verify_metamask_signature(
        wallet_address=req.wallet_address,
        signature=req.signature,
        nonce=req.nonce,
        db=db
    )

    access_token = create_access_token(
        data={"sub": profile.wallet_address, "role": profile.role, "profile_id": profile.id}
    )

    # Log audit event
    audit = AuditEvent(
        actor_wallet=profile.wallet_address,
        action_type="USER_AUTHENTICATED_METAMASK",
        details={"role": profile.role, "auth_method": "metamask_signature"}
    )
    db.add(audit)
    db.commit()

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=profile.role,
        wallet_address=profile.wallet_address,
        profile={
            "id": profile.id,
            "full_name": profile.full_name,
            "email": profile.email,
            "organization": profile.organization,
            "badge_number": profile.badge_number,
            "role": profile.role,
        }
    )

@router.post("/demo-login", response_model=AuthTokenResponse)
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    Hackathon evaluation demo login.
    Enables rapid evaluation with pre-configured role profiles without requiring a live MetaMask signature.
    """
    role = req.role.lower()
    if role not in ["admin", "investigator", "volunteer"]:
        role = "investigator"

    # Default wallet addresses matching Hardhat accounts
    role_wallets = {
        "admin": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".lower(),
        "investigator": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8".lower(),
        "volunteer": "0x90f79bf6eb2c4f870365e785982e1f101e93b906".lower(),
    }

    wallet_address = (req.wallet_address or role_wallets.get(role, role_wallets["investigator"])).lower()

    profile = db.query(Profile).filter(Profile.wallet_address == wallet_address).first()
    if not profile:
        profile = Profile(
            wallet_address=wallet_address,
            full_name=f"Demo {role.capitalize()} ({wallet_address[:6]}...{wallet_address[-4:]})",
            role=role,
            is_active=True,
            organization="FindGrid Incident Command Demo Team"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    access_token = create_access_token(
        data={"sub": profile.wallet_address, "role": profile.role, "profile_id": profile.id}
    )

    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=profile.role,
        wallet_address=profile.wallet_address,
        profile={
            "id": profile.id,
            "full_name": profile.full_name,
            "email": profile.email,
            "organization": profile.organization,
            "badge_number": profile.badge_number,
            "role": profile.role,
        }
    )

@router.get("/me", response_model=ProfileResponse)
def get_current_user_profile(current_user: Profile = Depends(get_current_user)):
    """Fetch the currently authenticated user profile and roles."""
    return current_user
