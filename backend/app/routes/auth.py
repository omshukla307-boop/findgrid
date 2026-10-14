from eth_account import Account
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Profile, AuthenticationNonce, AuditEvent
from app.schemas import (
    NonceRequest, NonceResponse, VerifySignatureRequest,
    AuthTokenResponse, DemoLoginRequest, ProfileResponse,
    EmailLoginRequest, CitizenRegisterRequest
)
from app.auth import (
    generate_nonce, verify_metamask_signature, create_access_token,
    get_auth_message, get_current_user, hash_password, verify_password
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

@router.post("/login-email", response_model=AuthTokenResponse)
def login_with_email(req: EmailLoginRequest, db: Session = Depends(get_db)):
    """
    Standard email and password authentication for citizens, community volunteers, and responders.
    """
    norm_email = req.email.strip().lower()
    profile = db.query(Profile).filter(Profile.email.ilike(norm_email)).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. Please register as a new community responder."
        )

    # Password validation with support for pre-seeded test accounts
    is_valid = False
    if profile.password_hash:
        is_valid = verify_password(req.password, profile.password_hash)
    elif req.password in ["Password123!", "demo123", "password", "findgrid"]:
        # Upgrade seeded profile with PBKDF2 hash
        profile.password_hash = hash_password(req.password)
        db.commit()
        is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify your credentials or use the 1-Click Demo Profiles."
        )

    if not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated. Contact an administrator."
        )

    access_token = create_access_token(
        data={"sub": profile.wallet_address, "role": profile.role, "profile_id": profile.id}
    )

    audit = AuditEvent(
        actor_wallet=profile.wallet_address,
        action_type="USER_AUTHENTICATED_EMAIL",
        details={"role": profile.role, "auth_method": "email_password", "email": norm_email}
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

@router.post("/register", response_model=AuthTokenResponse)
def register_citizen(req: CitizenRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a standard citizen or community responder account without needing MetaMask.
    Provisions an internal EVM account behind the scenes to maintain seamless smart contract compatibility.
    """
    norm_email = req.email.strip().lower()
    existing = db.query(Profile).filter(Profile.email.ilike(norm_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # Automatically provision EVM keypair for Web3 registry compatibility
    evm_account = Account.create()
    wallet_address = evm_account.address.lower()

    role = req.role.lower() if req.role and req.role.lower() in ["volunteer", "public"] else "volunteer"

    profile = Profile(
        wallet_address=wallet_address,
        full_name=req.full_name.strip(),
        email=norm_email,
        password_hash=hash_password(req.password),
        organization=req.organization.strip() if req.organization else "Community Volunteer",
        role=role,
        is_active=True
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    access_token = create_access_token(
        data={"sub": profile.wallet_address, "role": profile.role, "profile_id": profile.id}
    )

    audit = AuditEvent(
        actor_wallet=profile.wallet_address,
        action_type="CITIZEN_REGISTERED",
        details={"role": profile.role, "auth_method": "citizen_email_registration", "email": norm_email}
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

@router.get("/me", response_model=ProfileResponse)
def get_current_user_profile(current_user: Profile = Depends(get_current_user)):
    """Fetch the currently authenticated user profile and roles."""
    return current_user
