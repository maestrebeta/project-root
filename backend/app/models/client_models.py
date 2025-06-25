from sqlalchemy import Column, Integer, String, Boolean, func, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Client(Base):
    __tablename__ = "clients"

    client_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    organization_id = Column(Integer, ForeignKey('organizations.organization_id'), nullable=False)
    country_code = Column(String(2), ForeignKey('countries.country_code'), nullable=True)
    address = Column(Text, nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    tax_id = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    organization = relationship("Organization", back_populates="clients")
    country = relationship("Country", back_populates="clients")
    projects = relationship("Project", back_populates="client")
    tickets = relationship("Ticket", back_populates="client")
    external_users = relationship("ExternalUser", back_populates="client")
    ratings = relationship("OrganizationRating", back_populates="client")

    __table_args__ = (
        UniqueConstraint('name', 'organization_id', name='unique_client_name_per_organization'),
    )
