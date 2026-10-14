import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import jwt
from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import AuthenticationNonce, Profile

security = HTTPBearer(auto_error=False)

def get_auth_message(nonce: str) -> str:
    return f"Sign this one-time challenge to authenticate securely with FindGrid:\nNonce: {nonce}"

def generate_nonce(wallet_address: str, db: Session) -> AuthenticationNonce:
    # Expire previous unconsumed nonces for this wallet
    norm_wallet = wallet_address.lower()
    db.query(AuthenticationNonce).filter(
        AuthenticationNonce.wallet_address == norm_wallet,
        AuthenticationNonce.is_consumed == False
    ).update({"is_consumed": True})
    db.commit()

    nonce_str = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.NONCE_EXPIRE_MINUTES)

    nonce_record = AuthenticationNonce(
        wallet_address=norm_wallet,
        nonce=nonce_str,
        expires_at=expires_at,
        is_consumed=False
    )
    db.add(nonce_record)
    db.commit()
    db.refresh(nonce_record)
    return nonce_record

def verify_metamask_signature(wallet_address: str, signature: str, nonce: str, db: Session) -> Profile:
    norm_wallet = wallet_address.lower()
    
    # 1. Lookup nonce record
    nonce_record = db.query(AuthenticationNonce).filter(
        AuthenticationNonce.wallet_address == norm_wallet,
        AuthenticationNonce.nonce == nonce,
        AuthenticationNonce.is_consumed == False
    ).first()

    if not nonce_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication nonce is invalid or has already been consumed."
        )

    # 2. Check expiration
    expires_at = nonce_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        nonce_record.is_consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication nonce has expired. Please request a new challenge."
        )

    # 3. Cryptographic signature recovery (EIP-191 personal_sign)
    message_text = get_auth_message(nonce)
    try:
        signable_message = encode_defunct(text=message_text)
        recovered_address = Account.recover_message(signable_message, signature=signature)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Cryptographic signature verification failed: {str(e)}"
        )

    if recovered_address.lower() != norm_wallet:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Signature recovered address ({recovered_address.lower()}) does not match supplied wallet ({norm_wallet})."
        )

    # 4. Mark nonce consumed (prevent replay attacks)
    nonce_record.is_consumed = True
    db.commit()

    # 5. Fetch or register user profile
    profile = db.query(Profile).filter(Profile.wallet_address == norm_wallet).first()
    if not profile:
        profile = Profile(
            wallet_address=norm_wallet,
            full_name=f"User {norm_wallet[:6]}...{norm_wallet[-4:]}",
            role="investigator", # Default to investigator for hackathon evaluation
            is_active=True
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[Profile]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        wallet_address = payload.get("sub")
        if not wallet_address:
            return None
        profile = db.query(Profile).filter(Profile.wallet_address == wallet_address.lower()).first()
        return profile
    except (jwt.PyJWTError, Exception):
        return None

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Profile:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required (Bearer token)."
        )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        wallet_address = payload.get("sub")
        if not wallet_address:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing wallet address subject claim."
            )
        profile = db.query(Profile).filter(Profile.wallet_address == wallet_address.lower()).first()
        if not profile or not profile.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found or inactive."
            )
        return profile
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please re-authenticate with MetaMask."
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in self.allowed_roles and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)} (current: {current_user.role})"
            )
        return current_user

require_investigator_or_admin = RoleChecker(["investigator", "admin"])
require_admin = RoleChecker(["admin"])
require_authenticated = RoleChecker(["volunteer", "investigator", "admin"])
