from pydantic import BaseModel
from typing import Optional


class ContactOut(BaseModel):
    id: str
    name: str
    company: str
    email: str
    requirement: str
    requirement_type: Optional[str] = None
    attachment_name: Optional[str] = None
    status: str = "new"
    created_at: str
