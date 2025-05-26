from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Country(Base):
    __tablename__ = "countries"

    country_code = Column(String(2), primary_key=True)
    country_name = Column(String(100), nullable=False)
    continent = Column(String(50), nullable=False)
    phone_code = Column(String(10), nullable=True)
    currency_code = Column(String(3), nullable=True)
    currency_symbol = Column(String(5), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relaciones
    clients = relationship("Client", back_populates="country")
    # Puedes agregar más relaciones según sea necesario 