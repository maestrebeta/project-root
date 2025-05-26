from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, TIMESTAMP, Enum, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class Ticket(Base):
    __tablename__ = "tickets"
    
    ticket_id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=True)
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
    tags = Column(JSONB, nullable=True)
    estimated_hours = Column(Integer, nullable=True)
    
    # Restricciones de estado y prioridad
    __table_args__ = (
        CheckConstraint("status IN ('nuevo', 'en_progreso', 'listo_pruebas', 'cerrado')", name='valid_ticket_status'),
        CheckConstraint("priority IN ('baja', 'media', 'alta', 'critica')", name='valid_ticket_priority')
    )
    
    # Relaciones
    project = relationship("Project", back_populates="tickets")
    client = relationship("Client", back_populates="tickets")
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
