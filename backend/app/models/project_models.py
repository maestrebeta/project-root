from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, CheckConstraint, func, DateTime, Table, UniqueConstraint, Numeric
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
    status = Column(String(30), nullable=False)
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
        CheckConstraint("status IN ('registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support')", name='projects_status_check'),
        UniqueConstraint('name', 'client_id', name='unique_project_client')
    )

    client = relationship("Client", back_populates="projects")
    manager = relationship("User", back_populates="projects_managed")
    organizations = relationship("Organization", secondary=project_organizations, back_populates="projects")
    time_entries = relationship("TimeEntry", back_populates="project")
    tickets = relationship("Ticket", back_populates="project")
    organization = relationship("Organization", foreign_keys=[organization_id])
    invoices = relationship("Invoice", back_populates="project")
    budgets = relationship("ProjectBudget", back_populates="project")
    epics = relationship("Epic", back_populates="project", cascade="all, delete-orphan")
    user_stories = relationship("UserStory", back_populates="project", cascade="all, delete-orphan")

class ProjectBudget(Base):
    __tablename__ = "project_budgets"
    
    budget_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    estimated_hours = Column(Numeric(10, 2), nullable=False)
    estimated_cost = Column(Numeric(12, 2), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relaciones
    project = relationship("Project", back_populates="budgets")
