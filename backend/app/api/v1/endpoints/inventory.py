from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import User, InventoryItem
from app.schemas.dto import InventoryItemCreate, InventoryItemResponse

router = APIRouter()


@router.get("/", response_model=List[InventoryItemResponse])
def list_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all products in the user's personal shelf/memory."""
    items = (
        db.query(InventoryItem)
        .filter(InventoryItem.user_id == current_user.id)
        .order_by(InventoryItem.created_at.desc())
        .all()
    )
    return items


@router.post("/", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def add_inventory_item(
    item_in: InventoryItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a product and experience notes (e.g., oxidized, broke me out) to user memory."""
    new_item = InventoryItem(
        user_id=current_user.id,
        product_name=item_in.product_name,
        brand=item_in.brand,
        category=item_in.category,
        status=item_in.status,
        rating=item_in.rating,
        experience_notes=item_in.experience_notes,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a product from the user's personal shelf."""
    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    db.delete(item)
    db.commit()
    return None
