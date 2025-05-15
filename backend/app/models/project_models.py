from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, CheckConstraint, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True)
    description = Column(Text)
    project_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("project_type IN ('development', 'support', 'meeting', 'training', 'other')"),
        CheckConstraint("status IN ('active', 'paused', 'completed', 'archived')"),
    )

    client = relationship("Client", back_populates="projects")
    tickets = relationship("Ticket", back_populates="project")
