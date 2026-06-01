from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.product import Product
from app.models.inventory import InventoryLog, LogType
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductStockUpdate

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    if low_stock:
        query = query.filter(Product.stock_quantity <= Product.low_stock_threshold)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product.sku}' already exists")
    
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    if db_product.stock_quantity > 0:
        log = InventoryLog(
            product_id=db_product.id,
            log_type=LogType.restock,
            quantity_change=db_product.stock_quantity,
            quantity_before=0,
            quantity_after=db_product.stock_quantity,
            notes="Initial stock"
        )
        db.add(log)
        db.commit()

    return db_product

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()

@router.post("/{product_id}/restock", response_model=ProductResponse)
def restock_product(product_id: int, stock_update: ProductStockUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if stock_update.quantity <= 0:
        raise HTTPException(status_code=400, detail="Restock quantity must be positive")
    
    before = product.stock_quantity
    product.stock_quantity += stock_update.quantity

    log = InventoryLog(
        product_id=product.id,
        log_type=LogType.restock,
        quantity_change=stock_update.quantity,
        quantity_before=before,
        quantity_after=product.stock_quantity,
        notes=stock_update.notes
    )
    db.add(log)
    db.commit()
    db.refresh(product)
    return product

@router.get("/categories/list")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category).distinct().filter(Product.category.isnot(None)).all()
    return [c[0] for c in categories]
