from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime, timezone
import enum

class NotificationType(str, enum.Enum):
    TICKET_ASSIGNED = "ticket_assigned"
    TASK_ASSIGNED = "task_assigned"
    USER_STORY_ASSIGNED = "user_story_assigned"
    TICKET_STATUS_CHANGED = "ticket_status_changed"
    TASK_STATUS_CHANGED = "task_status_changed"
    SYSTEM_ALERT = "system_alert"
    MENTION = "mention"
    DEADLINE_REMINDER = "deadline_reminder"

class NotificationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    DELETED = "deleted"

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    
    # Usuario que recibe la notificación
    recipient_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    # Usuario que genera la notificación (opcional)
    sender_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    # Organización
    organization_id = Column(Integer, ForeignKey("organizations.organization_id"), nullable=False)
    
    # Tipo y contenido
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    
    # Referencias a entidades relacionadas
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"), nullable=True)
    user_story_id = Column(Integer, ForeignKey("user_stories.story_id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=True)
    
    # Metadatos
    notification_metadata = Column(JSON, nullable=True)  # Datos adicionales específicos del tipo
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relaciones
    recipient = relationship("User", foreign_keys=[recipient_user_id], back_populates="received_notifications")
    sender = relationship("User", foreign_keys=[sender_user_id], back_populates="sent_notifications")
    organization = relationship("Organization", back_populates="notifications")
    ticket = relationship("Ticket", back_populates="notifications")
    task = relationship("Task", back_populates="notifications")
    user_story = relationship("UserStory", back_populates="notifications")
    project = relationship("Project", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.notification_id}, type={self.type}, recipient={self.recipient_user_id})>" 