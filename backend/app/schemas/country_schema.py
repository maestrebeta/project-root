from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CountryBase(BaseModel):
    country_code: str = Field(..., min_length=2, max_length=2)
    country_name: str = Field(..., min_length=1, max_length=100)
    continent: str = Field(..., min_length=1, max_length=50)
    phone_code: Optional[str] = Field(None, max_length=10)
    currency_code: Optional[str] = Field(None, max_length=3)
    currency_symbol: Optional[str] = Field(None, max_length=5)
    is_active: Optional[bool] = True


class CountryCreate(CountryBase):
    pass


class CountryUpdate(CountryBase):
    pass


class CountryOut(CountryBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 