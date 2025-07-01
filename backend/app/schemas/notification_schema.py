from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    TICKET_ASSIGNED = "ticket_assigned"
    TASK_ASSIGNED = "task_assigned"
    USER_STORY_ASSIGNED = "user_story_assigned"
    TICKET_STATUS_CHANGED = "ticket_status_changed"
    TASK_STATUS_CHANGED = "task_status_changed"
    SYSTEM_ALERT = "system_alert"
    MENTION = "mention"
    DEADLINE_REMINDER = "deadline_reminder"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    DELETED = "deleted"

class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    priority: NotificationPriority = NotificationPriority.MEDIUM
    ticket_id: Optional[int] = None
    task_id: Optional[int] = None
    user_story_id: Optional[int] = None
    project_id: Optional[int] = None
    notification_metadata: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    recipient_user_id: int
    sender_user_id: Optional[int] = None
    organization_id: int

class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None

class NotificationOut(NotificationBase):
    notification_id: int
    recipient_user_id: int
    sender_user_id: Optional[int] = None
    organization_id: int
    status: NotificationStatus
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Información adicional del remitente
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    
    # Información adicional de entidades relacionadas
    ticket_title: Optional[str] = None
    ticket_number: Optional[str] = None
    task_title: Optional[str] = None
    project_name: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationStats(BaseModel):
    total: int
    unread: int
    read: int
    deleted: int
    by_type: Dict[str, int]
    by_priority: Dict[str, int]

class NotificationBulkUpdate(BaseModel):
    notification_ids: list[int]
    status: NotificationStatus 