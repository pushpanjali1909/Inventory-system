from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import random, string
from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import InventoryLog, LogType
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter()

def generate_order_number():
    ts = datetime.now().strftime("%Y%m%d")
    rand = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ORD-{ts}-{rand}"

@router.get("/", response_model=List[OrderResponse])
def get_orders(
    skip: int = 0,
    limit: int = 100,
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    # Validate all products and stock BEFORE creating order
    order_items_data = []
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Quantity for product '{product.name}' must be positive")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, Requested: {item.quantity}"
            )
        order_items_data.append((product, item.quantity))

    # Create order
    order_number = generate_order_number()
    db_order = Order(
        order_number=order_number,
        customer_id=order.customer_id,
        notes=order.notes,
        status=OrderStatus.pending
    )
    db.add(db_order)
    db.flush()

    total = 0.0
    for product, quantity in order_items_data:
        subtotal = product.price * quantity
        total += subtotal

        order_item = OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
            subtotal=subtotal
        )
        db.add(order_item)

        # Deduct stock
        before = product.stock_quantity
        product.stock_quantity -= quantity
        
        log = InventoryLog(
            product_id=product.id,
            log_type=LogType.sale,
            quantity_change=-quantity,
            quantity_before=before,
            quantity_after=product.stock_quantity,
            reference=order_number,
            notes=f"Order {order_number}"
        )
        db.add(log)

    db_order.total_amount = total
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order_update.status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        # Return stock to inventory
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                before = product.stock_quantity
                product.stock_quantity += item.quantity
                log = InventoryLog(
                    product_id=product.id,
                    log_type=LogType.return_,
                    quantity_change=item.quantity,
                    quantity_before=before,
                    quantity_after=product.stock_quantity,
                    reference=order.order_number,
                    notes=f"Order {order.order_number} cancelled"
                )
                db.add(log)
    
    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    return order

@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()

@router.get("/stats/summary")
def get_order_stats(db: Session = Depends(get_db)):
    total = db.query(Order).count()
    pending = db.query(Order).filter(Order.status == OrderStatus.pending).count()
    confirmed = db.query(Order).filter(Order.status == OrderStatus.confirmed).count()
    shipped = db.query(Order).filter(Order.status == OrderStatus.shipped).count()
    delivered = db.query(Order).filter(Order.status == OrderStatus.delivered).count()
    cancelled = db.query(Order).filter(Order.status == OrderStatus.cancelled).count()
    from sqlalchemy import func
    revenue = db.query(func.sum(Order.total_amount)).filter(Order.status != OrderStatus.cancelled).scalar() or 0
    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "shipped": shipped,
        "delivered": delivered,
        "cancelled": cancelled,
        "total_revenue": revenue
    }
