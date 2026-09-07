import logging
import os
import shutil
import smtplib
import uuid
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from backend.lib.dates import fmt, utcnow
from backend.models.contact import ContactOut

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".csv", ".xlsx", ".docx"}

# Email config — set these as environment variables in production
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", SMTP_USER)


def _format_type(raw: Optional[str]) -> str:
    if not raw:
        return "Not specified"
    return raw.replace("_", " ").upper()


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
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, NOTIFY_EMAIL]):
        logger.warning("SMTP not configured — skipping email notification.")
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

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(msg)


@router.post("/contact", response_model=ContactOut)
def submit_contact(
    name: str = Form(...),
    company: str = Form(...),
    email: str = Form(...),
    requirement: str = Form(...),
    requirement_type: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
):
    submission_id = str(uuid.uuid4())
    now = utcnow()

    attachment_name = None
    attachment_path = None

    if attachment and attachment.filename:
        ext = os.path.splitext(attachment.filename)[1].lower()
        if ext in ALLOWED_EXTENSIONS:
            saved_name = f"{submission_id}{ext}"
            file_path = os.path.join(UPLOAD_DIR, saved_name)
            with open(file_path, "wb") as f:
                shutil.copyfileobj(attachment.file, f)
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
