from datetime import datetime, timezone


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def fmt(dt: datetime) -> str:
    return dt.strftime("%d %b %Y · %H:%M UTC")
