from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ExternalForm(Base):
    __tablename__ = "external_forms"
    
    form_id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.organization_id"), nullable=False)
    form_token = Column(String(64), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    title = Column(String(200), nullable=False, default="Portal de Soporte")
    description = Column(Text, nullable=True)
    welcome_message = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relaciones
    organization = relationship("Organization", back_populates="external_forms")
    created_by_user = relationship("User", back_populates="created_external_forms")
    
    # Restricción única: una organización solo puede tener un formulario activo
    __table_args__ = (
        UniqueConstraint('organization_id', 'is_active', name='unique_active_form_per_organization'),
    ) 