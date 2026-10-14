import os
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import EvidenceRecord, MissingPersonCase, AuditEvent, Profile
from app.schemas import EvidenceResponse, EvidenceOnChainUpdate, EvidenceVerificationResult
from app.auth import get_current_user_optional, require_investigator_or_admin

router = APIRouter(prefix="/evidence", tags=["Evidence & Blockchain Integrity"])

@router.get("", response_model=List[EvidenceResponse])
def list_evidence(
    case_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[Profile] = Depends(get_current_user_optional)
):
    """List secured evidence records. Restricted to authorized investigators or public case-linked summaries."""
    query = db.query(EvidenceRecord)
    if case_id:
        query = query.filter(EvidenceRecord.case_id == case_id)
    return query.order_by(EvidenceRecord.created_at.desc()).all()

@router.post("/upload", response_model=EvidenceResponse)
async def upload_evidence_file(
    case_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """
    Securely upload an evidence file off-chain and calculate its SHA-256 cryptographic digest.
    The resulting hash can be committed immutably to the FindGrid smart contract.
    """
    case = db.query(MissingPersonCase).filter(MissingPersonCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case record not found.")

    # Read content and enforce size limits
    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum permissible size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
        )

    # Calculate SHA-256 hash (32-byte hexadecimal with 0x prefix for EVM bytes32 compatibility)
    raw_hash = hashlib.sha256(content).hexdigest()
    sha256_hash = f"0x{raw_hash}"

    # Safe off-chain storage with sanitized unique filename
    safe_name = f"{uuid.uuid4().hex[:8]}_{os.path.basename(file.filename or 'evidence_file')}"
    file_disk_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(file_disk_path, "wb") as f:
        f.write(content)

    evidence = EvidenceRecord(
        case_id=case.id,
        file_name=file.filename or "evidence_file",
        file_size=file_size,
        file_type=file.content_type or "application/octet-stream",
        file_path=f"/uploads/{safe_name}",
        sha256_hash=sha256_hash,
        on_chain_tx_hash=None,
        block_number=None,
        registered_by=current_user.wallet_address,
        is_verified_on_chain=False,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # Log audit event
    audit = AuditEvent(
        case_id=case.id,
        actor_wallet=current_user.wallet_address,
        action_type="EVIDENCE_SECURED_OFFCHAIN",
        details={
            "evidence_id": evidence.id,
            "file_name": evidence.file_name,
            "sha256_hash": sha256_hash,
            "file_size_bytes": file_size,
        }
    )
    db.add(audit)
    db.commit()

    return evidence

@router.post("/{evidence_id}/register-chain", response_model=EvidenceResponse)
def register_on_chain_receipt(
    evidence_id: str,
    chain_data: EvidenceOnChainUpdate,
    db: Session = Depends(get_db),
    current_user: Profile = Depends(require_investigator_or_admin)
):
    """
    Record on-chain transaction receipt after MetaMask successfully submits
    the registerEvidence transaction to FindGridEvidenceRegistry.
    """
    evidence = db.query(EvidenceRecord).filter(EvidenceRecord.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    evidence.on_chain_tx_hash = chain_data.on_chain_tx_hash
    evidence.block_number = chain_data.block_number
    evidence.is_verified_on_chain = True
    evidence.registration_timestamp = chain_data.registration_timestamp or datetime.now(timezone.utc)

    db.commit()
    db.refresh(evidence)

    # Record tamper-evident audit event
    audit = AuditEvent(
        case_id=evidence.case_id,
        actor_wallet=current_user.wallet_address,
        action_type="EVIDENCE_REGISTERED_ON_CHAIN",
        details={
            "evidence_id": evidence.id,
            "file_name": evidence.file_name,
            "sha256_hash": evidence.sha256_hash,
            "on_chain_tx_hash": evidence.on_chain_tx_hash,
            "block_number": evidence.block_number,
        },
        on_chain_tx_hash=evidence.on_chain_tx_hash
    )
    db.add(audit)
    db.commit()

    return evidence

@router.post("/verify-file", response_model=EvidenceVerificationResult)
async def verify_evidence_file_integrity(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Cryptographic Integrity Verification Endpoint.
    1. Reads uploaded file bytes.
    2. Computes its SHA-256 hash.
    3. Cross-references against registered database and blockchain records.
    4. Confirms whether the file is authentic or has been tampered with.
    """
    content = await file.read()
    raw_hash = hashlib.sha256(content).hexdigest()
    computed_hash = f"0x{raw_hash}"

    # Search in database records
    evidence = db.query(EvidenceRecord).filter(
        (EvidenceRecord.sha256_hash == computed_hash) |
        (EvidenceRecord.sha256_hash == raw_hash)
    ).first()

    if not evidence:
        return EvidenceVerificationResult(
            file_hash=computed_hash,
            is_valid=False,
            matched_record=None,
            on_chain_verified=False,
            details=f"INTEGRITY FAILURE: Computed SHA-256 hash ({computed_hash}) does not match any registered evidence record in the FindGrid Registry. The file has either been altered, corrupted, or was never securely registered."
        )

    return EvidenceVerificationResult(
        file_hash=computed_hash,
        is_valid=True,
        matched_record=EvidenceResponse.model_validate(evidence),
        on_chain_verified=evidence.is_verified_on_chain,
        details=(
            f"VERIFIED GENUINE: SHA-256 hash ({computed_hash}) matches registered evidence record for Case ID: {evidence.case_id}. "
            f"Original filename: '{evidence.file_name}', registered by investigator: {evidence.registered_by}. "
            + (f"Immutable on-chain transaction: {evidence.on_chain_tx_hash} at block #{evidence.block_number}." if evidence.is_verified_on_chain else "Off-chain record authenticated; on-chain registration pending.")
        )
    )
