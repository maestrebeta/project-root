from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, CheckConstraint, func, DateTime, Table, UniqueConstraint, Numeric, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

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
    tags = Column(JSON, nullable=True)
    organization_id = Column(Integer, ForeignKey('organizations.organization_id'), nullable=True)

    __table_args__ = (
        # Restricciones de tipos de proyecto y estado según la definición SQL
        CheckConstraint("project_type IN ('web_development', 'mobile_development', 'desktop_development', 'api_development', 'database_design', 'cloud_migration', 'devops_infrastructure', 'security_audit', 'ui_ux_design', 'testing_qa', 'maintenance_support', 'consulting', 'training', 'research_development', 'other')", name='projects_project_type_check'),
        CheckConstraint("status IN ('registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support')", name='projects_status_check'),
        UniqueConstraint('name', 'client_id', name='unique_project_client')
    )

    client = relationship("Client", back_populates="projects")
    manager = relationship("User", back_populates="projects_managed")
    organization = relationship("Organization", back_populates="projects")
    time_entries = relationship("TimeEntry", back_populates="project")
    tickets = relationship("Ticket", back_populates="project")
    invoices = relationship("Invoice", back_populates="project")
    budgets = relationship("ProjectBudget", back_populates="project")
    epics = relationship("Epic", back_populates="project", cascade="all, delete-orphan")
    user_stories = relationship("UserStory", back_populates="project", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="project", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="project")

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

class Quotation(Base):
    __tablename__ = "quotations"
    
    quotation_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='USD', nullable=False)
    status = Column(String(20), default='draft', nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'sent', 'approved', 'rejected', 'expired')", name='valid_quote_status'),
        CheckConstraint("currency IN ('USD', 'EUR', 'COP', 'MXN')", name='valid_currency')
    )
    
    # Relaciones
    project = relationship("Project", back_populates="quotations")
    created_by = relationship("User")
    installments = relationship("QuotationInstallment", back_populates="quotation", cascade="all, delete-orphan")

class QuotationInstallment(Base):
    __tablename__ = "quotation_installments"
    
    installment_id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.quotation_id"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)  # Porcentaje del total (ej: 20.00)
    amount = Column(Numeric(12, 2), nullable=False)     # Monto calculado
    due_date = Column(Date, nullable=True)
    is_paid = Column(Boolean, default=False, nullable=False)
    paid_date = Column(Date, nullable=True)
    payment_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint("percentage >= 0 AND percentage <= 100", name='valid_percentage'),
        CheckConstraint("amount >= 0", name='valid_amount'),
        UniqueConstraint('quotation_id', 'installment_number', name='unique_installment_number')
    )
    
    # Relaciones
    quotation = relationship("Quotation", back_populates="installments")
