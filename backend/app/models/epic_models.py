from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean, CheckConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Epic(Base):
    __tablename__ = "epics"

    epic_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default='backlog')
    priority = Column(String(20), default='medium')
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Numeric(10, 2), nullable=True)  # Calculado desde user stories
    actual_hours = Column(Numeric(10, 2), nullable=True, default=0)
    progress_percentage = Column(Numeric(5, 2), nullable=True, default=0)
    color = Column(String(7), nullable=True, default='#3B82F6')  # Color hex para UI
    tags = Column(JSON, nullable=True)
    acceptance_criteria = Column(Text, nullable=True)
    business_value = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relaciones
    project = relationship("Project", back_populates="epics")
    user_stories = relationship("UserStory", back_populates="epic", cascade="all, delete-orphan")

class UserStory(Base):
    __tablename__ = "user_stories"

    story_id = Column(Integer, primary_key=True, index=True)
    epic_id = Column(Integer, ForeignKey("epics.epic_id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    acceptance_criteria = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default='backlog')
    priority = Column(String(20), default='medium')
    
    # Especialización y sub-especializaciones
    specialization = Column(String(50), nullable=True, default='development')
    sub_specializations = Column(JSON, nullable=True)  # Array de sub-especializaciones
    estimated_hours = Column(Numeric(8, 2), nullable=True, default=8)  # Estimación principal
    
    # Estimaciones detalladas por tipo de trabajo
    ui_hours = Column(Numeric(8, 2), nullable=True, default=0)
    development_hours = Column(Numeric(8, 2), nullable=True, default=0)
    testing_hours = Column(Numeric(8, 2), nullable=True, default=0)
    documentation_hours = Column(Numeric(8, 2), nullable=True, default=0)
    
    # Horas reales trabajadas
    actual_hours = Column(Numeric(8, 2), nullable=True, default=0)
    
    # Asignación y fechas
    assigned_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    sprint_id = Column(Integer, nullable=True)  # Para futuras implementaciones de sprints
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    
    # Metadatos
    tags = Column(JSON, nullable=True)
    checklist = Column(JSON, nullable=True)  # Lista de tareas
    comments = Column(JSON, nullable=True)   # Comentarios y actividad
    attachments = Column(JSON, nullable=True) # Archivos adjuntos
    color = Column(String(7), nullable=True, default='#10B981')
    
    # Configuración
    is_blocked = Column(Boolean, default=False)
    blocked_reason = Column(Text, nullable=True)
    business_value = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Restricciones
    __table_args__ = (
        CheckConstraint("specialization IN ('development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis')", name='valid_story_specializations'),
    )

    # Relaciones
    epic = relationship("Epic", back_populates="user_stories")
    project = relationship("Project", back_populates="user_stories")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    time_entries = relationship("TimeEntry", back_populates="user_story") 