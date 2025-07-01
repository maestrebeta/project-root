from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, CheckConstraint, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    profile_image = Column(Text, nullable=True)
    theme_preferences = Column(JSON, nullable=True)
    organization_id = Column(Integer, ForeignKey('organizations.organization_id'), nullable=True)
    country_code = Column(String(2), nullable=True)
    timezone = Column(String(50), default='UTC')
    language = Column(String(10), default='es')
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Nuevos campos para especialización
    specialization = Column(String(50), nullable=True, default='development')
    sub_specializations = Column(JSON, nullable=True)  # Array de sub-especializaciones
    hourly_rate = Column(Integer, nullable=True)  # Tarifa por hora
    weekly_capacity = Column(Integer, nullable=True, default=40)  # Capacidad semanal en horas
    skills = Column(JSON, nullable=True)  # Habilidades y nivel de competencia
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Restricción de roles
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'dev', 'infra', 'super_user', 'external_user')", name='valid_user_roles'),
        CheckConstraint("specialization IN ('development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis')", name='valid_specializations'),
    )

    organization = relationship("Organization", back_populates="users")
    time_entries = relationship("TimeEntry", back_populates="user")
    projects_managed = relationship("Project", back_populates="manager")
    
    # Relaciones de tickets con foreign_keys especificados
    tickets_reported = relationship(
        "Ticket", 
        foreign_keys="[Ticket.reported_by_user_id]", 
        back_populates="reported_by_user"
    )
    tickets_assigned = relationship(
        "Ticket", 
        foreign_keys="[Ticket.assigned_to_user_id]", 
        back_populates="assigned_to_user"
    )
    
    # Relaciones para comentarios y cambios en tickets
    ticket_comments = relationship("TicketComment", back_populates="user")
    ticket_history_changes = relationship("TicketHistory", back_populates="changed_by_user")
    
    # Relaciones para tareas
    tasks_assigned = relationship(
        "Task", 
        foreign_keys="[Task.assigned_to]", 
        back_populates="assigned_to_user"
    )
    tasks_created = relationship(
        "Task", 
        foreign_keys="[Task.assigned_by]", 
        back_populates="assigned_by_user"
    )
    
    # Relación para formularios externos creados
    created_external_forms = relationship("ExternalForm", back_populates="created_by_user")
    
    # Relaciones para notificaciones
    received_notifications = relationship(
        "Notification", 
        foreign_keys="[Notification.recipient_user_id]", 
        back_populates="recipient"
    )
    sent_notifications = relationship(
        "Notification", 
        foreign_keys="[Notification.sender_user_id]", 
        back_populates="sender"
    )

class ExternalUser(Base):
    __tablename__ = "external_users"
    
    external_user_id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.organization_id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=True)  # Relación con cliente
    username = Column(String(50), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable para usuarios sin contraseña
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    organization = relationship("Organization", back_populates="external_users")
    client = relationship("Client", back_populates="external_users")
    tickets = relationship("Ticket", back_populates="external_user")
    ratings = relationship("OrganizationRating", back_populates="external_user")