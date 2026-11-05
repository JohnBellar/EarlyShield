# EarlyShield

EarlyShield is an AI-assisted scam and phishing message analysis application. It uses a custom XLM-RoBERTa model to estimate message risk and identify scam tactics.

> **Status:** Development project. Model predictions are informational and should not be treated as a guarantee that a message is safe or fraudulent.

## Features

- Analyze a message for scam/phishing risk.
- Display a risk assessment and detected tactics.
- Save and review analysis history.
- View dashboard statistics.
- React + Vite frontend.
- FastAPI backend with SQLAlchemy and SQLite.
- PyTorch + Transformers model inference.

## Project structure

```text
EarlyShield/
├── backend/
│   ├── main.py
│   ├── model.py
│   ├── models/
│   │   └── xlmr_unified_tanglish_best.pth   # Download separately (not in Git)
│   └── requirements.txt
└── frontend/
    └── ...                                   # React + Vite app
```

## Requirements

- Python **3.12**
- Node.js and npm (a current LTS release is recommended)
- Git
- The EarlyShield model checkpoint (approximately 1 GB; distributed separately)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/JohnBellar/EarlyShield.git
cd EarlyShield
```

### 2. Set up the model checkpoint

The model checkpoint is not stored in this Git repository because it is large.

Download `xlmr_unified_tanglish_best.pth` from the project owner's shared download location, then place it here:

```text
EarlyShield/backend/models/xlmr_unified_tanglish_best.pth
```

Keep the filename and folder path exactly as shown. The backend resolves the checkpoint relative to its own source directory.

### 3. Set up the backend

From the repository root:

```bash
cd backend
python3.12 -m venv .venv
```

Activate the environment:

**macOS/Linux**
```bash
source .venv/bin/activate
```

**Windows (PowerShell)**
```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Start the API:

```bash
python -m uvicorn main:app --reload
```

The API should be available at:

- API: http://127.0.0.1:8000
- Interactive API docs: http://127.0.0.1:8000/docs

Leave this terminal running.

### 4. Set up the frontend

Open a **second terminal** at the repository root:

```bash
cd EarlyShield/frontend
npm install
npm run dev
```

Vite will print the local frontend URL (usually http://localhost:5173). Open that URL in your browser.

## Running EarlyShield later

Start the backend and frontend in two terminals:

**Terminal 1 — backend**
```bash
cd EarlyShield/backend
source .venv/bin/activate
python -m uvicorn main:app --reload
```

**Terminal 2 — frontend**
```bash
cd EarlyShield/frontend
npm run dev
```

On Windows, activate the backend environment with:
```powershell
EarlyShield\backend\.venv\Scripts\Activate.ps1
```

## API endpoints

The backend currently includes these endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/analyze` | Analyze a message |
| `GET` | `/api/history` | Retrieve analysis history |
| `GET` | `/api/history/{id}` | Retrieve one history record |
| `DELETE` | `/api/history/{id}` | Delete a history record |
| `GET` | `/api/dashboard/stats` | Retrieve dashboard statistics |

See `/docs` while the backend is running for the interactive API schema.

## Troubleshooting

- **Checkpoint not found:** Confirm the file is named `xlmr_unified_tanglish_best.pth` and is located in `backend/models/`.
- **Python version issues:** Use Python 3.12; do not reuse another computer's virtual environment.
- **Backend import/install errors:** Activate the backend `.venv` and install `backend/requirements.txt` in that environment.
- **Frontend dependency errors:** Run `npm install` from `frontend/`.
- **Port already in use:** Stop the other process using port `8000` or `5173`, or configure a different port.

## Important limitations

- Model output is probabilistic and can be wrong. Always verify suspicious messages through official channels.
- Do not enter real passwords, OTPs, payment details, or other sensitive information into development/testing environments.
- This project is currently intended for local development.

## License

No license has been specified yet. All rights reserved by the project owner unless a license is added to this repository.
