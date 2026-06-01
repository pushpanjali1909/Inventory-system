from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.product import Product
from app.models.inventory import InventoryLog, LogType
from app.schemas.inventory import InventoryAdjustment, InventoryLogResponse

router = APIRouter()

@router.get("/logs", response_model=List[InventoryLogResponse])
def get_inventory_logs(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = None,
    log_type: Optional[LogType] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryLog)
    if product_id:
        query = query.filter(InventoryLog.product_id == product_id)
    if log_type:
        query = query.filter(InventoryLog.log_type == log_type)
    return query.order_by(InventoryLog.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/adjust/{product_id}", response_model=InventoryLogResponse)
def adjust_inventory(product_id: int, adjustment: InventoryAdjustment, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_qty = product.stock_quantity + adjustment.quantity_change
    if new_qty < 0:
        raise HTTPException(status_code=400, detail=f"Adjustment would result in negative stock. Current: {product.stock_quantity}")
    
    before = product.stock_quantity
    product.stock_quantity = new_qty
    
    log = InventoryLog(
        product_id=product.id,
        log_type=adjustment.log_type,
        quantity_change=adjustment.quantity_change,
        quantity_before=before,
        quantity_after=new_qty,
        notes=adjustment.notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/summary")
def get_inventory_summary(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_products = len(products)
    total_stock = sum(p.stock_quantity for p in products)
    low_stock = [p for p in products if p.stock_quantity <= p.low_stock_threshold]
    out_of_stock = [p for p in products if p.stock_quantity == 0]
    total_value = sum(p.stock_quantity * p.price for p in products)
    return {
        "total_products": total_products,
        "total_stock_units": total_stock,
        "low_stock_count": len(low_stock),
        "out_of_stock_count": len(out_of_stock),
        "total_inventory_value": total_value,
        "low_stock_products": [{"id": p.id, "name": p.name, "sku": p.sku, "stock": p.stock_quantity, "threshold": p.low_stock_threshold} for p in low_stock]
    }
