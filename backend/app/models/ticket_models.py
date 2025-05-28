from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, TIMESTAMP, CheckConstraint, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Ticket(Base):
    __tablename__ = "tickets"
    
    ticket_id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.organization_id"), nullable=False)
    reported_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    category = Column(String(50), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    resolution_description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(TIMESTAMP)
    
    # Nuevos campos
    tags = Column(JSON, nullable=True)
    estimated_hours = Column(Integer, nullable=True)
    
    # Restricciones de estado y prioridad
    __table_args__ = (
        CheckConstraint("status IN ('nuevo', 'en_progreso', 'listo_pruebas', 'cerrado')", name='valid_ticket_status'),
        CheckConstraint("priority IN ('baja', 'media', 'alta', 'critica')", name='valid_ticket_priority')
    )
    
    # Relaciones
    project = relationship("Project", back_populates="tickets")
    client = relationship("Client", back_populates="tickets")
    organization = relationship("Organization", back_populates="tickets")
    reported_by_user = relationship(
        "User", 
        foreign_keys=[reported_by_user_id], 
        back_populates="tickets_reported"
    )
    assigned_to_user = relationship(
        "User", 
        foreign_keys=[assigned_to_user_id], 
        back_populates="tickets_assigned"
    )
    time_entries = relationship("TimeEntry", back_populates="ticket")
    comments = relationship("TicketComment", back_populates="ticket")
    history = relationship("TicketHistory", back_populates="ticket")

class TicketComment(Base):
    __tablename__ = "ticket_comments"
    
    comment_id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    comment_text = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    ticket = relationship("Ticket", back_populates="comments")
    user = relationship("User", back_populates="ticket_comments")

class TicketHistory(Base):
    __tablename__ = "ticket_history"
    
    history_id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.ticket_id"), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    changed_field = Column(String(50), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    change_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    ticket = relationship("Ticket", back_populates="history")
    changed_by_user = relationship("User", back_populates="ticket_history_changes")
