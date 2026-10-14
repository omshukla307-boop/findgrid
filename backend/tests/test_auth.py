import pytest
from eth_account import Account
from eth_account.messages import encode_defunct
from app.database import Base, engine, SessionLocal
from app.models import Profile, AuthenticationNonce
from app.auth import generate_nonce, verify_metamask_signature, get_auth_message, create_access_token

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup

def test_nonce_generation_and_consumption():
    db = SessionLocal()
    try:
        # Create a fresh test wallet
        test_account = Account.create()
        wallet_address = test_account.address.lower()

        # 1. Generate nonce
        nonce_record = generate_nonce(wallet_address, db)
        assert nonce_record.wallet_address == wallet_address
        assert len(nonce_record.nonce) == 64
        assert not nonce_record.is_consumed

        # 2. Sign challenge message using eth_account (mimicking MetaMask personal_sign)
        challenge_text = get_auth_message(nonce_record.nonce)
        signable_message = encode_defunct(text=challenge_text)
        signed_message = Account.sign_message(signable_message, private_key=test_account.key)
        signature = signed_message.signature.hex()

        # 3. Verify signature
        profile = verify_metamask_signature(wallet_address, signature, nonce_record.nonce, db)
        assert profile.wallet_address == wallet_address

        # 4. Replay attack test: verify should fail with consumed nonce
        with pytest.raises(Exception):
            verify_metamask_signature(wallet_address, signature, nonce_record.nonce, db)

    finally:
        db.close()

def test_jwt_token_creation():
    token = create_access_token({"sub": "0x1234567890123456789012345678901234567890", "role": "investigator"})
    assert isinstance(token, str)
    assert len(token) > 20
