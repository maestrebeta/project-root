from sqlalchemy import Column, Integer, String, ForeignKey, Text, Date, TIMESTAMP, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy.sql import func

class Ticket(Base):
    __tablename__ = "tickets"
    
    ticket_id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.project_id"))
    client_id = Column(Integer, ForeignKey("clients.client_id"))
    reported_by_user_id = Column(Integer, ForeignKey("users.user_id"))
    assigned_to_user_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False)
    category = Column(String(50), nullable=False)
    due_date = Column(Date)
    resolution_description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(TIMESTAMP)
    closed_at = Column(TIMESTAMP)
    
    # Relaciones
    project = relationship("Project", back_populates="tickets")
    client = relationship("Client", back_populates="tickets")
    reported_by_user = relationship("User", foreign_keys=[reported_by_user_id], back_populates="tickets_reported")
    assigned_to_user = relationship("User", foreign_keys=[assigned_to_user_id], back_populates="tickets_assigned")
