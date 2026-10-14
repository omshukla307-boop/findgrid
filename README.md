# FindGrid — AI-Powered Missing Person Search & Coordination Platform

FindGrid is an emergency incident response and coordination platform that unifies explainable multi-factor Artificial Intelligence, decentralized Solidity blockchain evidence registries, MetaMask cryptographic authentication, interactive GIS mapping, and crowdsourced volunteer field coordination.

---

## 1. Division of Architectural Responsibility

FindGrid integrates four distinct architectural pillars, with strictly delineated roles:

| Component | Technology | Primary Role & Responsibility |
|---|---|---|
| **Artificial Intelligence** | Python (Cosine vector similarity, Haversine geospatial proximity, temporal velocity modeling) | Analyzes correlation between missing person descriptions and submitted sightings. Evaluates physical traits, apparel matching, distance ($d$ in km), and required transit speed ($v$ in km/h). Outputs an explainable composite score ($0-100\%$), individual factor weights, flagged discrepancies, and recommended actions. **Requires human investigator sign-off.** |
| **Blockchain** | Solidity Smart Contract (`FindGridEvidenceRegistry.sol`), Hardhat, ethers.js | Immutable, decentralized audit log and evidence integrity registry. Stores SHA-256 cryptographic hashes of off-chain evidence files, block timestamps, authorized investigator addresses, and case status transition history. **Never stores PII on-chain.** |
| **MetaMask Authentication** | Web3 / EIP-191 Personal Signatures, Python `eth_account`, JWT | Wallet-based authentication using single-use challenge nonces issued by the server. Verifies signature against recovered address on the FastAPI backend, prevents replay attacks, and issues short-lived JWT session tokens. Eliminates seed phrase exposure and phishing vulnerabilities. |
| **Secure Database** | Supabase PostgreSQL / SQLite fallback, SQLAlchemy, Row Level Security (RLS) | Stores full confidential case dossiers, protected contact records, physical descriptors, volunteer assignments, and search zones. RLS policies protect sensitive files and redact personal contact numbers from unauthorized viewers. |

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 with Vite & TypeScript
- **Styling**: Tailwind CSS (Dark navy `#070b14` and cyan `#06b6d4` cyber theme)
- **Routing**: React Router v7
- **Mapping**: Leaflet + OpenStreetMap (CartoDB Dark Matter tiles)
- **Analytics**: Recharts (Urgency bar charts & status distribution pie charts)
- **Icons**: Lucide React
- **Web3 Integration**: ethers.js v6

### Backend
- **Framework**: Python 3.13 + FastAPI
- **Data Validation**: Pydantic v2
- **ORM & Database**: SQLAlchemy (SQLite for instant zero-dependency local dev; Supabase PostgreSQL with RLS for production)
- **Authentication**: `eth-account` cryptographic signature recovery + PyJWT
- **AI Similarity Engine**: Custom multi-factor spatiotemporal similarity algorithm

### Blockchain
- **Smart Contract**: Solidity `^0.8.20` (`FindGridEvidenceRegistry`)
- **Development Tooling**: Hardhat, Hardhat Toolbox, ethers.js v6
- **Test Suite**: Mocha / Chai (9 passing unit tests)

---

## 3. The 13 Complete Platform Pages

1. **Landing Page (`/`)**: Incident command overview, live operational metrics counter, architecture highlights, and quick CTAs.
2. **MetaMask Login (`/login`)**: EIP-191 challenge nonce request, wallet signature verification, and 1-click Demo Role access (Investigator, Admin, Volunteer).
3. **Operational Dashboard (`/dashboard`)**: Role-based command center with real DB analytics, urgency distribution charts, and audit telemetry.
4. **Missing Person Reports (`/cases`)**: Searchable case registry with urgency badges, status filters, table/grid toggles, and "Open New Case" modal.
5. **Case Dossier & Evidence Management (`/cases/:id`)**: Physical profile, last-seen location, off-chain evidence upload, live SHA-256 calculation, on-chain registry trigger, and chronological timeline.
6. **Sightings Crowdsourcing & Triage (`/sightings`)**: Public/volunteer sighting submission form with instant AI proximity trigger, plus investigator review queue.
7. **AI Report Matching & Correlation (`/ai-matching`)**: Candidate match cards, 4-factor explainable score gauges ($0-100\%$), discrepancy alerts, human review decision actions (Accept/Reject), and batch AI re-evaluation.
8. **Tactical Search Map (`/map`)**: Leaflet OpenStreetMap grid displaying approximate last-seen pins, submitted sightings, and circular operational search zones (e.g. 500m radius).
9. **Volunteer Search Operations (`/volunteers`)**: Active task board, volunteer roster with badge numbers, and sector crew assignment modal.
10. **Decentralized Evidence Verification Lab (`/blockchain`)**: Drag-and-drop file hash verifier, client-side Web Crypto SHA-256 calculation, on-chain contract state verification, and authentic vs. tampered test buttons.
11. **System Audit Trail (`/audit`)**: Tamper-evident chronological log of case creations, status shifts, and blockchain transaction receipts.
12. **User & Role Clearance (`/users`)**: Role-based access administration (Admin, Investigator, Volunteer) and officer directory.
13. **System Settings & Architecture (`/settings`)**: Connected wallet details, RPC configuration, contract address, and AI sensitivity sliders.

---

## 4. Quick Start & Local Development

### Prerequisites
- Node.js `v20+` (tested with v24.19)
- Python `3.11+` (tested with v3.13)
- MetaMask browser extension (optional for demo login mode)

### 1. Blockchain (Hardhat) Setup
```powershell
cd contracts
npm install
# Compile smart contracts
npx hardhat compile

# Run Hardhat test suite (9 tests covering access control, hashing, tamper detection)
npx hardhat test

# (Optional) Run local node:
npx hardhat node

# Deploy locally:
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Backend (FastAPI) Setup
```powershell
cd backend
# Install python dependencies
python -m pip install -r requirements.txt

# Run backend unit tests (auth, AI engine, cases, tamper verification)
$env:PYTHONPATH="backend"; python -m pytest backend/tests

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### 3. Frontend (React + Vite) Setup
```powershell
cd frontend
npm install

# Build production bundle
npm run build

# Start dev server on port 5173
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. MetaMask Network Configuration for Local Blockchain

If you want to sign transactions with MetaMask on local Hardhat:
1. Open MetaMask &rarr; Click Network Selector &rarr; **Add Network** &rarr; **Add a network manually**.
2. **Network Name**: `Hardhat Local`
3. **New RPC URL**: `http://127.0.0.1:8545`
4. **Chain ID**: `31337`
5. **Currency Symbol**: `ETH`
6. Click **Save**.

### Import Pre-Funded Demo Accounts into MetaMask:
- **Investigator (Hardhat Account #1)**:
  - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Admin / Contract Deployer (Hardhat Account #0)**:
  - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

*(Note: You can also evaluate all features instantly using the **1-Click Demo Login** on the `/login` page without importing private keys into MetaMask).*

---

## 6. Documented Hackathon Demonstration Scenario

Execute this exact 11-step workflow to demonstrate the full end-to-end integration:

| Step | Action | How to Demonstrate in FindGrid |
|---|---|---|
| **1** | **Connect MetaMask / Sign Challenge** | Navigate to `/login`. Click **Sign In with MetaMask** to sign the EIP-191 challenge nonce, or click **Investigator (Det. Marcus Reed)** in the Demo Profiles list. |
| **2** | **Create a Missing Person Case** | Navigate to `/cases` &rarr; Click **Open New Case**. Enter title, name (e.g. `Maya Lin`), urgency (`Critical`), last-seen coordinates, and submit. |
| **3** | **Upload Evidence File** | Open the case dossier &rarr; Navigate to the **Secured Evidence** tab. Upload a surveillance file (e.g. `cctv_frame.png`). |
| **4** | **System Calculates SHA-256** | The backend computes the 32-byte cryptographic SHA-256 hash automatically and displays it. |
| **5** | **Register Hash in Smart Contract** | Click **Register on Blockchain**. MetaMask pops up to sign the `registerEvidence` transaction on `FindGridEvidenceRegistry`. Once mined, the green `ON-CHAIN VERIFIED` receipt is shown. |
| **6** | **Volunteer Submits a Sighting** | Navigate to `/sightings` &rarr; Enter sighting location (e.g. `Bayside Pier Cafe`), matching clothing, and coordinates. Click **Submit Sighting**. |
| **7** | **AI Engine Identifies Potential Match** | Navigate to `/ai-matching`. The AI engine evaluates text, clothing, distance ($1.2\text{ km}$), and elapsed time ($1.75\text{ hrs}$), computing an explainable score of $\approx 88.4\%$. |
| **8** | **Investigator Reviews AI Match** | Click **Submit Review Decision** on the candidate card. Enter verification notes and click **Accept Match**. |
| **9** | **Audit Trail Records Status Change** | Navigate to `/audit` or the case **Timeline** tab. Observe the tamper-evident log documenting `AI_MATCH_CONFIRMED` and `STATUS_CHANGED`. |
| **10** | **Evidence Verification Confirms Authentic File** | Navigate to `/blockchain`. Click **Load Authentic File (Step 10 Pass)**. The cryptographic lab computes the hash, verifies against the smart contract, and returns a green **INTEGRITY VERIFIED: AUTHENTIC** proof. |
| **11** | **Modified File Fails Verification Check** | On `/blockchain`, click **Load Tampered File (Step 11 Fail)**. The altered byte stream yields a hash mismatch, triggering a red **TAMPER ALERT: VERIFICATION FAILED** alert. |

---

## 7. Cloud Deployment Guide

### Frontend Deployment (Vercel)
1. Fork or push the `frontend` folder to GitHub.
2. In Vercel, click **Add New Project** &rarr; Select repository &rarr; Set root directory to `frontend`.
3. Set Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-findgrid-backend.onrender.com/api`
   - `VITE_CONTRACT_ADDRESS`: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (or deployed testnet address)
4. Click **Deploy**.

### Backend Deployment (Render)
1. Connect your GitHub repository to Render as a **Web Service**.
2. Root Directory: `backend`
3. Environment: `Python 3`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Set Environment Variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `JWT_SECRET`: Random 64-character secret
7. Click **Create Web Service**.

### Supabase Database & Row Level Security Setup
1. Create a project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the entire contents of `supabase/schema.sql`.
4. Copy the connection string under **Project Settings &rarr; Database &rarr; URI** and set as `DATABASE_URL` on your backend.
