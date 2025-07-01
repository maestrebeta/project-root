from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime, timezone, timedelta

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

    # Campos para gestión de suscripciones
    subscription_status = Column(String(20), default='active')  # active, suspended, expired, trial
    subscription_duration_months = Column(Integer, default=1)  # Duración del plan en meses (1, 3, 6, 12)
    trial_start_date = Column(DateTime(timezone=True), nullable=True)
    trial_end_date = Column(DateTime(timezone=True), nullable=True)
    subscription_start_date = Column(DateTime(timezone=True), nullable=True)
    subscription_end_date = Column(DateTime(timezone=True), nullable=True)
    last_payment_date = Column(DateTime(timezone=True), nullable=True)
    next_payment_date = Column(DateTime(timezone=True), nullable=True)
    payment_method = Column(String(50), nullable=True)
    billing_email = Column(String(100), nullable=True)
    
    # Configuración de notificaciones
    notification_settings = Column(JSON, nullable=False, default={
        "trial_expiry_warning": True,
        "subscription_expiry_warning": True,
        "payment_failed": True,
        "plan_upgrade": True,
        "plan_downgrade": True
    })

    # Estados predeterminados del sistema
    DEFAULT_TASK_STATES = {
        "states": [
            {"id": 1, "label": "Pendiente", "icon": "🔴", "color": "red", "isDefault": True},
            {"id": 2, "label": "En Progreso", "icon": "🔵", "color": "blue", "isDefault": True},
            {"id": 3, "label": "Completada", "icon": "🟢", "color": "green", "isDefault": True}
        ],
        "default_state": 1,
        "final_states": [3]
    }

    # Estados predeterminados de Kanban
    DEFAULT_KANBAN_STATES = {
        "states": [
            {"id": 1, "key": "backlog", "label": "Backlog", "color": "bg-gray-100", "textColor": "text-gray-700", "isDefault": True, "isProtected": True},
            {"id": 2, "key": "nuevo", "label": "Nuevo", "color": "bg-blue-50", "textColor": "text-blue-700", "isDefault": True},
            {"id": 3, "key": "en_progreso", "label": "En Progreso", "color": "bg-yellow-50", "textColor": "text-yellow-700", "isDefault": True},
            {"id": 4, "key": "listo_pruebas", "label": "Listo para Pruebas", "color": "bg-orange-50", "textColor": "text-orange-700", "isDefault": True},
            {"id": 5, "key": "done", "label": "Completado", "color": "bg-green-50", "textColor": "text-green-700", "isDefault": True, "isProtected": True}
        ],
        "default_state": 2,
        "final_states": [5]
    }

    # Configuración de estados
    task_states = Column(JSON, nullable=False, default=DEFAULT_TASK_STATES)
    kanban_states = Column(JSON, nullable=False, default=DEFAULT_KANBAN_STATES)
    
    # Categorías de actividad predeterminadas
    DEFAULT_ACTIVITY_CATEGORIES = [
        {"id": 1, "name": "Desarrollo", "description": "Desarrollo de software y programación", "isDefault": True},
        {"id": 2, "name": "Reunión", "description": "Reuniones y coordinación", "isDefault": True},
        {"id": 3, "name": "Capacitación", "description": "Capacitación y aprendizaje", "isDefault": True},
        {"id": 4, "name": "Documentación", "description": "Documentación técnica y de usuario", "isDefault": True},
        {"id": 5, "name": "Soporte", "description": "Soporte técnico y mantenimiento", "isDefault": True},
        {"id": 6, "name": "Testing", "description": "Pruebas y control de calidad", "isDefault": True},
        {"id": 7, "name": "Diseño", "description": "Diseño de interfaces y UX", "isDefault": True},
        {"id": 8, "name": "Otra", "description": "Otras actividades", "isDefault": True}
    ]
    
    # Configuración de categorías de actividad
    activity_categories = Column(JSON, nullable=False, default=DEFAULT_ACTIVITY_CATEGORIES)
    
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
    notifications = relationship("Notification", back_populates="organization")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Si es un plan gratuito y no tiene fecha de inicio de prueba, establecerla
        if self.subscription_plan == 'free' and not self.trial_start_date:
            self.trial_start_date = datetime.now(timezone.utc)
        if not self.trial_end_date:
            self.trial_end_date = self.trial_start_date + timedelta(days=14)
        if not self.subscription_status:
            self.subscription_status = 'trial'

    @property
    def is_subscription_active(self):
        """Verifica si la suscripción está activa."""
        if not self.is_active:
            return False
        
        # Si es un plan gratuito, verificar el período de prueba
        if self.subscription_plan == 'free':
            if self.trial_end_date and datetime.now(timezone.utc) > self.trial_end_date:
                return False
        
        # Verificar si la suscripción ha expirado
        if self.subscription_end_date and datetime.now(timezone.utc) > self.subscription_end_date:
            return False
        
        # Verificar el estado de la suscripción
        if self.subscription_status in ['suspended', 'expired']:
            return False
        
        return True

    @property
    def days_until_trial_expiry(self):
        """Retorna los días restantes hasta que expire el período de prueba."""
        if not self.trial_end_date:
            return None
        delta = self.trial_end_date - datetime.now(timezone.utc)
        return max(0, delta.days)

    @property
    def days_until_subscription_expiry(self):
        """Retorna los días restantes hasta que expire la suscripción."""
        if not self.subscription_end_date:
            return None
        delta = self.subscription_end_date - datetime.now(timezone.utc)
        return max(0, delta.days)

    @property
    def should_show_trial_warning(self):
        """Determina si se debe mostrar advertencia de fin de prueba"""
        days_left = self.days_until_trial_expiry
        return days_left is not None and days_left <= 3 and self.subscription_status == 'trial'

    @property
    def should_show_subscription_warning(self):
        """Determina si se debe mostrar advertencia de fin de suscripción"""
        days_left = self.days_until_subscription_expiry
        return days_left is not None and days_left <= 7 and self.subscription_status == 'active'

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