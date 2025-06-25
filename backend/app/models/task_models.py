from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Date, TIMESTAMP, CheckConstraint, Boolean, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"
    
    task_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default='pending')
    priority = Column(String(20), nullable=False, default='medium')
    assigned_to = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.organization_id"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Integer, nullable=True)
    actual_hours = Column(Integer, nullable=True)
    tags = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Restricciones
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'blocked')", name='valid_task_status'),
        CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name='valid_task_priority')
    )
    
    # Relaciones
    assigned_to_user = relationship(
        "User", 
        foreign_keys=[assigned_to], 
        back_populates="tasks_assigned"
    )
    assigned_by_user = relationship(
        "User", 
        foreign_keys=[assigned_by], 
        back_populates="tasks_created"
    )
    organization = relationship("Organization", back_populates="tasks") 