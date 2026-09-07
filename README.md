# Nautix

Marine requirements website — built with React, FastAPI, and Tailwind CSS.

---

## Prerequisites

Before running the project, make sure the following are installed on your machine:

| Tool | Version | Download |
|---|---|---|
| Node.js | v18 or higher | https://nodejs.org |
| Python | 3.9 or higher | https://python.org |
| Git | any | https://git-scm.com |

Yarn will be installed automatically by the start script if it is not already present.

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/mahesh-maney/nautix.git
cd nautix
```

### 2. Start the project

**Mac / Linux**
```bash
bash start.sh
```

**Windows (PowerShell)**
```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

The script will:
- Check all prerequisites
- Install frontend and backend dependencies automatically
- Create a Python virtual environment inside `backend/.venv`
- Start both the frontend and backend servers

Once running, open your browser at the URL printed in the console:

```
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  NAUTIX is running                               │
  │                                                  │
  │  Website  →  http://localhost:5173               │
  │  API docs →  http://localhost:8000/docs          │
  │                                                  │
  │  Press Ctrl+C to stop                            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

Press **Ctrl+C** to stop both servers.

---

## Email configuration

Contact form submissions are delivered by email. To enable this, create a file at `backend/.env` with the following:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contact@nautix.com
SMTP_PASSWORD=your-google-app-password
NOTIFY_EMAIL=contact@nautix.com
```

See `backend/.env.example` for a full reference.

**Getting a Google App Password:**
1. Sign in to your Google account at myaccount.google.com
2. Go to **Security** and enable **2-Step Verification**
3. Search for **App Passwords**
4. Create one named "Nautix Website" and copy the 16-character password

Without `backend/.env`, the form still works locally — submissions are accepted and files are saved, but no email is sent.

---

## Project structure

```
nautix/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Home.tsx, Privacy.tsx
│   │   ├── components/ui/  # shadcn/ui components
│   │   └── lib/            # API client, query client
│   └── public/images/      # Static assets including logo
│
├── backend/                # Python FastAPI backend
│   ├── routers/
│   │   └── contact.py      # POST /api/contact — receives form, sends email
│   ├── models/
│   │   └── contact.py      # Pydantic response model
│   ├── lib/
│   │   └── dates.py        # Date formatting utilities
│   ├── uploads/            # Saved attachment files
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Email configuration reference
│
├── start.sh                # Startup script — Mac / Linux
├── start.ps1               # Startup script — Windows
└── README.md
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI, Uvicorn |
| Email | SMTP via Python standard library |
| Font | Manrope (variable) |
