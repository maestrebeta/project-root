from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text
from sqlalchemy.ext.declarative import declared_attr
from app.core.database import Base

class TimeEntry(Base):
    __tablename__ = "time_entries"

    entry_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    entry_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    activity_type = Column(String(50), nullable=False, default='trabajo')
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    description = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default='completado')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Nuevos campos
    ticket_id = Column(Integer, ForeignKey('tickets.ticket_id'), nullable=True)
    billable = Column(Boolean, default=True)
    organization_id = Column(Integer, ForeignKey('organizations.organization_id'), nullable=True)

    # Columna generada para duration_hours
    duration_hours = Column(Numeric(5, 2), nullable=True, server_default=text("NULL"), server_computed=True)

    # Relaciones
    user = relationship("User", back_populates="time_entries")
    project = relationship("Project", back_populates="time_entries")
    ticket = relationship("Ticket", back_populates="time_entries")
    organization = relationship("Organization", back_populates="time_entries")