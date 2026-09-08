import json
import logging
import os
import shutil
import smtplib
import time
import uuid
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from backend.lib.dates import fmt, utcnow
from backend.lib.limiter import limiter
from backend.models.contact import ContactOut

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Directories ───────────────────────────────────────────────────────────────

_BASE = os.path.dirname(os.path.dirname(__file__))

UPLOAD_DIR = os.path.join(_BASE, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

FALLBACK_LOG_DIR = os.path.join(_BASE, "logs")
os.makedirs(FALLBACK_LOG_DIR, exist_ok=True)
FALLBACK_LOG = os.path.join(FALLBACK_LOG_DIR, "failed_submissions.jsonl")

# ── Config ────────────────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".csv", ".xlsx", ".docx"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
UPLOAD_MAX_AGE_DAYS = int(os.getenv("UPLOAD_MAX_AGE_DAYS", "30"))

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", SMTP_USER)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _format_type(raw: Optional[str]) -> str:
    if not raw:
        return "Not specified"
    return raw.replace("_", " ").upper()


def _log_fallback(submission: dict, error: str) -> None:
    """Write full submission details to a local log so no enquiry is ever lost."""
    entry = {**submission, "fallback_reason": error, "logged_at": utcnow().isoformat()}
    try:
        with open(FALLBACK_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")
        logger.error(
            "SMTP failure — submission saved to fallback log. "
            "name=%s company=%s email=%s error=%s",
            submission.get("name"),
            submission.get("company"),
            submission.get("email"),
            error,
        )
    except Exception as log_err:
        # Last resort: at minimum get it into the process log
        logger.critical(
            "SMTP failure AND fallback log write failed. "
            "name=%s company=%s email=%s smtp_error=%s log_error=%s",
            submission.get("name"),
            submission.get("company"),
            submission.get("email"),
            error,
            log_err,
        )


def _cleanup_old_uploads() -> None:
    """Remove uploaded files older than UPLOAD_MAX_AGE_DAYS days."""
    cutoff = time.time() - UPLOAD_MAX_AGE_DAYS * 86400
    try:
        for fname in os.listdir(UPLOAD_DIR):
            fpath = os.path.join(UPLOAD_DIR, fname)
            if os.path.isfile(fpath) and os.path.getmtime(fpath) < cutoff:
                os.remove(fpath)
                logger.info("Removed old upload: %s", fname)
    except Exception as e:
        logger.warning("Upload cleanup error: %s", e)


def _send_email(
    name: str,
    company: str,
    email: str,
    requirement: str,
    requirement_type: Optional[str],
    attachment_name: Optional[str],
    attachment_path: Optional[str],
    submitted_at: str,
) -> None:
    submission = {
        "name": name,
        "company": company,
        "email": email,
        "requirement": requirement,
        "requirement_type": requirement_type,
        "attachment_name": attachment_name,
        "submitted_at": submitted_at,
    }

    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, NOTIFY_EMAIL]):
        _log_fallback(submission, "SMTP not configured")
        return

    req_type = _format_type(requirement_type)

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = NOTIFY_EMAIL
    msg["Subject"] = f"New Nautix Requirement — {req_type} — {company}"

    body = f"""\
New requirement received via nautix.io

────────────────────────────────────────
TYPE        {req_type}
NAME        {name}
COMPANY     {company}
EMAIL       {email}
SUBMITTED   {submitted_at}
────────────────────────────────────────

REQUIREMENT:
{requirement}

ATTACHMENT: {attachment_name or "None"}
────────────────────────────────────────

Reply directly to {email} to respond to this enquiry.
"""
    msg.attach(MIMEText(body, "plain"))

    if attachment_path and attachment_name and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{attachment_name}"')
        msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        _log_fallback(submission, str(e))


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/contact", response_model=ContactOut)
@limiter.limit("5/hour")
def submit_contact(
    request: Request,
    name: str = Form(...),
    company: str = Form(...),
    email: str = Form(...),
    requirement: str = Form(...),
    requirement_type: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
):
    # Lazy cleanup of old uploads on each submission
    _cleanup_old_uploads()

    submission_id = str(uuid.uuid4())
    now = utcnow()

    attachment_name = None
    attachment_path = None

    if attachment and attachment.filename:
        ext = os.path.splitext(attachment.filename)[1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="File type not allowed.")

        contents = attachment.file.read()
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds the 10 MB limit.")

        saved_name = f"{submission_id}{ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_name)
        with open(file_path, "wb") as f:
            f.write(contents)

        attachment_name = attachment.filename
        attachment_path = file_path

    _send_email(
        name=name,
        company=company,
        email=email,
        requirement=requirement,
        requirement_type=requirement_type,
        attachment_name=attachment_name,
        attachment_path=attachment_path,
        submitted_at=fmt(now),
    )

    return ContactOut(
        id=submission_id,
        name=name,
        company=company,
        email=email,
        requirement=requirement,
        requirement_type=requirement_type,
        attachment_name=attachment_name,
        status="new",
        created_at=now.isoformat(),
    )
