from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    organization_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    country_code = Column(String(2), nullable=True)
    timezone = Column(String(50), default='UTC')
    subscription_plan = Column(String(20), default='free')
    max_users = Column(Integer, default=5)
    logo_url = Column(Text, nullable=True)
    primary_contact_email = Column(String(100), nullable=True)
    primary_contact_name = Column(String(100), nullable=True)
    primary_contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relaciones
    users = relationship("User", back_populates="organization")
    clients = relationship("Client", back_populates="organization")
    projects = relationship("Project", secondary="project_organizations", back_populates="organizations")
    time_entries = relationship("TimeEntry", back_populates="organization") 