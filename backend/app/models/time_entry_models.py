from sqlalchemy import Column, Integer, Date, Time, Text, String, TIMESTAMP, ForeignKey, Computed, DECIMAL
from app.core.database import Base

class TimeEntry(Base):
    __tablename__ = "time_entries"

    entry_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    activity_type = Column(String(50), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_hours = Column(DECIMAL(5, 2), Computed("EXTRACT(EPOCH FROM (end_time - start_time)) / 3600", persisted=True))
    description = Column(Text)
    status = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")