from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.inventory import LogType

class InventoryAdjustment(BaseModel):
    quantity_change: int
    log_type: LogType = LogType.adjustment
    notes: Optional[str] = None

class InventoryLogResponse(BaseModel):
    id: int
    product_id: int
    log_type: LogType
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
