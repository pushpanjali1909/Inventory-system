from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    stock_quantity: int = 0
    low_stock_threshold: int = 10

    @field_validator('price')
    @classmethod
    def price_must_be_positive(cls, v):
        if v < 0:
            raise ValueError('Price must be non-negative')
        return v

    @field_validator('stock_quantity')
    @classmethod
    def stock_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Stock quantity must be non-negative')
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    low_stock_threshold: Optional[int] = None

class ProductStockUpdate(BaseModel):
    quantity: int
    notes: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
