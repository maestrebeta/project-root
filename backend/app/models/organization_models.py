from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float, CheckConstraint
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

    # Estados predeterminados del sistema
    DEFAULT_TASK_STATES = {
        "states": [
            {"id": "pending", "label": "Pendiente", "icon": "🔴", "color": "red", "isDefault": True},
            {"id": "in_progress", "label": "En Progreso", "icon": "🔵", "color": "blue", "isDefault": True},
            {"id": "completed", "label": "Completada", "icon": "🟢", "color": "green", "isDefault": True},
            {"id": "blocked", "label": "Bloqueada", "icon": "🟠", "color": "orange", "isDefault": False}
        ],
        "default_state": "pending",
        "final_states": ["completed"]
    }

    # Configuración de estados
    task_states = Column(JSON, nullable=False, default=DEFAULT_TASK_STATES)
    
    # Configuración de horas de trabajo
    DEFAULT_WORK_HOURS = {
        "start_time": "08:00",
        "end_time": "17:00", 
        "lunch_break_start": "12:00",
        "lunch_break_end": "13:00",
        "working_days": [1, 2, 3, 4, 5],  # Lunes a Viernes (1=Lunes, 7=Domingo)
        "daily_hours": 8,  # Calculado automáticamente
        "effective_daily_hours": 7  # Descontando almuerzo
    }
    
    work_hours_config = Column(JSON, nullable=False, default=DEFAULT_WORK_HOURS)

    # Relaciones
    users = relationship("User", back_populates="organization")
    external_users = relationship("ExternalUser", back_populates="organization")
    clients = relationship("Client", back_populates="organization")
    projects = relationship("Project", back_populates="organization")
    time_entries = relationship("TimeEntry", back_populates="organization")
    tickets = relationship("Ticket", back_populates="organization") 
    ticket_categories = relationship("TicketCategory", back_populates="organization")
    tasks = relationship("Task", back_populates="organization")
    external_forms = relationship("ExternalForm", back_populates="organization")
    ratings = relationship("OrganizationRating", back_populates="organization")

class OrganizationRating(Base):
    __tablename__ = "organization_ratings"
    
    rating_id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.organization_id"), nullable=False)
    external_user_id = Column(Integer, ForeignKey("external_users.external_user_id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=False)
    rating = Column(Float, nullable=False)  # Calificación de 1 a 5
    comment = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Restricciones
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name='valid_rating_range'),
    )
    
    # Relaciones
    organization = relationship("Organization", back_populates="ratings")
    external_user = relationship("ExternalUser", back_populates="ratings")
    client = relationship("Client", back_populates="ratings") 