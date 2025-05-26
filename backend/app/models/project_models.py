from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, CheckConstraint, TIMESTAMP, func, DateTime, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

# Tabla intermedia para la relación muchos a muchos entre proyectos y organizaciones
project_organizations = Table(
    'project_organizations', Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.project_id'), primary_key=True),
    Column('organization_id', Integer, ForeignKey('organizations.organization_id'), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.client_id"), nullable=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=True)
    description = Column(Text, nullable=True)
    project_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    manager_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    estimated_hours = Column(Integer, nullable=True)
    priority = Column(String(20), default='medium')
    tags = Column(JSONB, nullable=True)
    organization_id = Column(Integer, ForeignKey('organizations.organization_id'), nullable=True)

    __table_args__ = (
        # Restricciones de tipos de proyecto y estado según la definición SQL
        CheckConstraint("project_type IN ('development', 'support', 'meeting', 'training', 'other')", name='projects_project_type_check'),
        CheckConstraint("status IN ('active', 'paused', 'completed', 'archived')", name='projects_status_check'),
        UniqueConstraint('name', 'client_id', name='unique_project_client')
    )

    client = relationship("Client", back_populates="projects")
    manager = relationship("User", back_populates="projects_managed")
    organizations = relationship("Organization", secondary=project_organizations, back_populates="projects")
    time_entries = relationship("TimeEntry", back_populates="project")
    tickets = relationship("Ticket", back_populates="project")
    organization = relationship("Organization", foreign_keys=[organization_id])
