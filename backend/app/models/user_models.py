from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.dialects.postgresql import JSONB

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    profile_image = Column(Text, nullable=True)
    theme_preferences = Column(JSONB, nullable=True)
    organization_id = Column(Integer, ForeignKey('organizations.organization_id'), nullable=True)
    country_code = Column(String(2), nullable=True)
    timezone = Column(String(50), default='UTC')
    language = Column(String(10), default='es')
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Restricción de roles
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'dev', 'infra', 'super_user')", name='valid_user_roles'),
    )

    organization = relationship("Organization", back_populates="users")
    time_entries = relationship("TimeEntry", back_populates="user")
    projects_managed = relationship("Project", back_populates="manager")
    
    # Relaciones de tickets con foreign_keys especificados
    tickets_reported = relationship(
        "Ticket", 
        foreign_keys="[Ticket.reported_by_user_id]", 
        back_populates="reported_by_user"
    )
    tickets_assigned = relationship(
        "Ticket", 
        foreign_keys="[Ticket.assigned_to_user_id]", 
        back_populates="assigned_to_user"
    )
    
    # Relaciones para comentarios y cambios en tickets
    ticket_comments = relationship("TicketComment", back_populates="user")
    ticket_history_changes = relationship("TicketHistory", back_populates="changed_by_user")
