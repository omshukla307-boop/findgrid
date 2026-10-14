// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FindGridEvidenceRegistry
 * @dev Decentralized tamper-evident audit and evidence verification registry
 * for the FindGrid AI-Powered Missing Person Search & Coordination Platform.
 *
 * Implements cryptographic integrity verification, role-based investigator authorization,
 * immutable evidence hash storage, and case status audit logging.
 *
 * NOTE: To protect privacy and adhere to data protection regulations, NO personally
 * identifiable information (PII) is stored on-chain. Only cryptographic hashes,
 * non-sensitive case identifiers, and audit records are preserved.
 */
contract FindGridEvidenceRegistry {
    // --- State Variables ---

    address public owner;
    
    // Mapping of authorized investigators / law enforcement wallets
    mapping(address => bool) public authorizedInvestigators;
    
    // Evidence record structure
    struct EvidenceRecord {
        bytes32 evidenceHash;      // Cryptographic SHA-256 hash of off-chain file
        string caseId;             // Non-sensitive unique case identifier (e.g. FG-2026-001)
        string evidenceType;       // E.g. "CCTV_FOOTAGE", "PHONE_RECORDS", "WITNESS_AUDIO"
        address registeredBy;      // Investigator wallet that submitted the record
        uint256 timestamp;         // Block timestamp of registration
        uint256 blockNumber;       // Block number of registration
        bool exists;               // Existence flag
    }

    // Status audit record structure
    struct StatusAuditEvent {
        string caseId;
        string previousStatus;
        string newStatus;
        string reason;
        address changedBy;
        uint256 timestamp;
    }

    // Mapping from evidence hash to EvidenceRecord
    mapping(bytes32 => EvidenceRecord) private _evidenceRecords;

    // Mapping from caseId to array of evidence hashes associated with it
    mapping(string => bytes32[]) private _caseEvidenceList;

    // Mapping from caseId to audit event history
    mapping(string => StatusAuditEvent[]) private _caseAuditHistory;

    // Total evidence records registered
    uint256 public totalEvidenceCount;

    // Total audit events recorded
    uint256 public totalAuditCount;

    // --- Events ---

    event InvestigatorAuthorized(address indexed account, address indexed authorizedBy);
    event InvestigatorRevoked(address indexed account, address indexed revokedBy);

    event EvidenceRegistered(
        bytes32 indexed evidenceHash,
        string indexed caseId,
        string evidenceType,
        address indexed registeredBy,
        uint256 timestamp,
        uint256 blockNumber
    );

    event CaseStatusAudited(
        string indexed caseId,
        string previousStatus,
        string newStatus,
        string reason,
        address indexed changedBy,
        uint256 timestamp
    );

    // --- Modifiers ---

    modifier onlyOwner() {
        require(msg.sender == owner, "FindGrid: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedInvestigators[msg.sender],
            "FindGrid: caller is not an authorized investigator"
        );
        _;
    }

    // --- Constructor ---

    constructor() {
        owner = msg.sender;
        authorizedInvestigators[msg.sender] = true;
        emit InvestigatorAuthorized(msg.sender, msg.sender);
    }

    // --- Authorization Management ---

    function authorizeInvestigator(address account) external onlyOwner {
        require(account != address(0), "FindGrid: zero address cannot be authorized");
        require(!authorizedInvestigators[account], "FindGrid: already authorized");
        authorizedInvestigators[account] = true;
        emit InvestigatorAuthorized(account, msg.sender);
    }

    function revokeInvestigator(address account) external onlyOwner {
        require(account != owner, "FindGrid: cannot revoke contract owner");
        require(authorizedInvestigators[account], "FindGrid: account not authorized");
        authorizedInvestigators[account] = false;
        emit InvestigatorRevoked(account, msg.sender);
    }

    // --- Evidence Registration ---

    /**
     * @notice Registers an evidence cryptographic hash linked to a case.
     * @dev Once registered, an evidence record cannot be altered or overwritten.
     * @param evidenceHash The SHA-256 hash of the evidence file
     * @param caseId The unique identifier of the case
     * @param evidenceType Short categorical descriptor of the evidence
     */
    function registerEvidence(
        bytes32 evidenceHash,
        string calldata caseId,
        string calldata evidenceType
    ) external onlyAuthorized {
        require(evidenceHash != bytes32(0), "FindGrid: invalid zero evidence hash");
        require(bytes(caseId).length > 0, "FindGrid: case ID cannot be empty");
        require(!_evidenceRecords[evidenceHash].exists, "FindGrid: evidence hash already registered");

        EvidenceRecord memory record = EvidenceRecord({
            evidenceHash: evidenceHash,
            caseId: caseId,
            evidenceType: evidenceType,
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        _evidenceRecords[evidenceHash] = record;
        _caseEvidenceList[caseId].push(evidenceHash);
        totalEvidenceCount++;

        emit EvidenceRegistered(
            evidenceHash,
            caseId,
            evidenceType,
            msg.sender,
            block.timestamp,
            block.number
        );
    }

    // --- Case Status Audit Logging ---

    /**
     * @notice Records an authorized case status change on-chain for tamper-proof audit trails.
     */
    function recordStatusAudit(
        string calldata caseId,
        string calldata previousStatus,
        string calldata newStatus,
        string calldata reason
    ) external onlyAuthorized {
        require(bytes(caseId).length > 0, "FindGrid: case ID cannot be empty");
        require(bytes(newStatus).length > 0, "FindGrid: new status cannot be empty");

        StatusAuditEvent memory audit = StatusAuditEvent({
            caseId: caseId,
            previousStatus: previousStatus,
            newStatus: newStatus,
            reason: reason,
            changedBy: msg.sender,
            timestamp: block.timestamp
        });

        _caseAuditHistory[caseId].push(audit);
        totalAuditCount++;

        emit CaseStatusAudited(
            caseId,
            previousStatus,
            newStatus,
            reason,
            msg.sender,
            block.timestamp
        );
    }

    // --- Verification & Read Queries ---

    /**
     * @notice Verifies if a given hash matches any registered evidence.
     * @param evidenceHash The SHA-256 hash to test
     */
    function verifyEvidence(bytes32 evidenceHash)
        external
        view
        returns (
            bool isValid,
            address registeredBy,
            uint256 timestamp,
            uint256 blockNumber,
            string memory caseId,
            string memory evidenceType
        )
    {
        EvidenceRecord memory record = _evidenceRecords[evidenceHash];
        if (!record.exists) {
            return (false, address(0), 0, 0, "", "");
        }
        return (
            true,
            record.registeredBy,
            record.timestamp,
            record.blockNumber,
            record.caseId,
            record.evidenceType
        );
    }

    /**
     * @notice Get all evidence hashes registered for a specific case.
     */
    function getCaseEvidenceList(string calldata caseId)
        external
        view
        returns (bytes32[] memory)
    {
        return _caseEvidenceList[caseId];
    }

    /**
     * @notice Get status audit history count for a case.
     */
    function getCaseAuditCount(string calldata caseId)
        external
        view
        returns (uint256)
    {
        return _caseAuditHistory[caseId].length;
    }

    /**
     * @notice Get specific status audit event for a case.
     */
    function getCaseAuditEvent(string calldata caseId, uint256 index)
        external
        view
        returns (
            string memory previousStatus,
            string memory newStatus,
            string memory reason,
            address changedBy,
            uint256 timestamp
        )
    {
        require(index < _caseAuditHistory[caseId].length, "FindGrid: index out of bounds");
        StatusAuditEvent memory audit = _caseAuditHistory[caseId][index];
        return (
            audit.previousStatus,
            audit.newStatus,
            audit.reason,
            audit.changedBy,
            audit.timestamp
        );
    }
}
