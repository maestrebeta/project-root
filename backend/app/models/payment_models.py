from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Date, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    
    invoice_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    issue_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False)
    payment_terms = Column(String(100))
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Restricciones
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'issued', 'paid', 'cancelled')",
            name="valid_invoice_status"
        ),
    )
    
    # Relaciones
    project = relationship("Project", back_populates="invoices")
    installments = relationship("PaymentInstallment", back_populates="invoice")

class PaymentInstallment(Base):
    __tablename__ = "payment_installments"
    
    installment_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0)
    paid_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Restricciones
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'paid', 'overdue', 'cancelled')",
            name="valid_installment_status"
        ),
    )
    
    # Relaciones
    invoice = relationship("Invoice", back_populates="installments")
    payments = relationship("Payment", back_populates="installment")

class Payment(Base):
    __tablename__ = "payments"
    
    payment_id = Column(Integer, primary_key=True, index=True)
    installment_id = Column(Integer, ForeignKey("payment_installments.installment_id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=False)
    reference_number = Column(String(100))
    notes = Column(String(500))
    recorded_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Restricciones
    __table_args__ = (
        CheckConstraint(
            "payment_method IN ('transfer', 'check', 'cash', 'credit_card')",
            name="valid_payment_method"
        ),
    )
    
    # Relaciones
    installment = relationship("PaymentInstallment", back_populates="payments")
    recorded_by = relationship("User", backref="recorded_payments")
