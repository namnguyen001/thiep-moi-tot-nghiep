# -*- coding: utf-8 -*-
import os
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Header, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SessionLocal
import models
import schemas

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Auto-migrate database to add new columns
def run_migrations():
    try:
        import migrate
        migrate.migrate_database()
    except Exception as e:
        print(f"Migration error (non-critical): {e}")

# Run migrations on startup
run_migrations()

# Auto-seed data if database is empty
def seed_database_if_empty():
    db = SessionLocal()
    try:
        # Check if any cards exist
        card_count = db.query(models.InvitationCard).count()
        if card_count == 0:
            print("Database is empty, running seed data...")
            # Import and run seed
            import seed
            seed.seed_data()
            print("Seed data completed!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

# Run seed on startup
seed_database_if_empty()

app = FastAPI(title="IvyInvi Multi-Card Graduation Invitation API", version="2.0.0")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


def get_admin_passcode(db: Session):
    admin = db.query(models.AdminUser).first()
    if not admin:
        admin = models.AdminUser(passcode="123456")
        db.add(admin)
        db.commit()
        db.refresh(admin)
    return admin.passcode


def verify_admin_token(x_admin_passcode: str = Header(None, alias="X-Admin-Passcode"), db: Session = Depends(get_db)):
    passcode = get_admin_passcode(db)
    if x_admin_passcode != passcode:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu quản trị (Admin Passcode) không chính xác."
        )
    return True


@app.get("/")
def read_root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": "Thiệp mời tốt nghiệp online API đang hoạt động."})


@app.get("/t/{slug}")
def read_card_by_slug(slug: str):
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": f"Thiệp mời slug: {slug}"})


@app.get("/admin")
def read_admin():
    admin_path = os.path.join(STATIC_DIR, "admin.html")
    if os.path.exists(admin_path):
        return FileResponse(admin_path)
    return JSONResponse({"message": "Trang quản lý admin..."})


# --- CARDS ENDPOINTS ---
@app.get("/api/cards", response_model=List[schemas.CardResponse])
def get_cards(db: Session = Depends(get_db)):
    return db.query(models.InvitationCard).order_by(models.InvitationCard.id.desc()).all()


@app.post("/api/cards", response_model=schemas.CardResponse)
def create_card(card_data: schemas.CardCreate, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    # Check slug uniqueness
    existing = db.query(models.InvitationCard).filter(models.InvitationCard.slug == card_data.slug).first()
    if existing:
        # Append random suffix if slug exists
        card_data.slug = f"{card_data.slug}-{uuid.uuid4().hex[:4]}"

    card = models.InvitationCard(**card_data.dict())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@app.get("/api/cards/{identifier}", response_model=schemas.CardResponse)
def get_card(identifier: str, db: Session = Depends(get_db)):
    card = None
    if identifier.isdigit():
        card = db.query(models.InvitationCard).filter(models.InvitationCard.id == int(identifier)).first()
    if not card:
        card = db.query(models.InvitationCard).filter(models.InvitationCard.slug == identifier).first()

    if not card:
        # Fallback to first card in DB
        card = db.query(models.InvitationCard).first()

    if not card:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp mời nào")

    # Increment view count
    card.view_count += 1
    db.commit()
    db.refresh(card)
    return card


@app.put("/api/cards/{card_id}", response_model=schemas.CardResponse)
def update_card(card_id: int, card_data: schemas.CardUpdate, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    card = db.query(models.InvitationCard).filter(models.InvitationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp")

    for key, value in card_data.dict(exclude_unset=True).items():
        setattr(card, key, value)

    db.commit()
    db.refresh(card)
    return card


@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    card = db.query(models.InvitationCard).filter(models.InvitationCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiệp")
    db.delete(card)
    db.commit()
    return {"message": "Đã xóa thiệp thành công"}


# --- PASSCODE UPDATE ---
@app.post("/api/admin/passcode")
def update_admin_passcode(payload: dict, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    new_passcode = payload.get("new_passcode")
    if not new_passcode:
        raise HTTPException(status_code=400, detail="Mật khẩu mới không được để trống")

    admin = db.query(models.AdminUser).first()
    if not admin:
        admin = models.AdminUser(passcode=new_passcode)
        db.add(admin)
    else:
        admin.passcode = new_passcode

    db.commit()
    return {"message": "Đã cập nhật mật khẩu Admin mới thành công!"}


# --- UPLOAD ENDPOINT ---
@app.post("/api/upload")
def upload_file(file: UploadFile = File(...), _: bool = Depends(verify_admin_token)):
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)

    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())

    url = f"/uploads/{filename}"
    return {"url": url, "filename": filename}


# --- PHOTOS PER CARD ---
@app.get("/api/cards/{card_id}/photos", response_model=List[schemas.PhotoResponse])
def get_card_photos(card_id: int, db: Session = Depends(get_db)):
    return db.query(models.Photo).filter(models.Photo.card_id == card_id).order_by(models.Photo.id.desc()).all()


@app.post("/api/photos", response_model=schemas.PhotoResponse)
def create_photo(photo_data: schemas.PhotoCreate, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    photo = models.Photo(**photo_data.dict())
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@app.delete("/api/photos/{photo_id}")
def delete_photo(photo_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Ảnh không tồn tại")
    db.delete(photo)
    db.commit()
    return {"message": "Đã xóa ảnh thành công"}


# --- GUESTS PER CARD ---
@app.get("/api/cards/{card_id}/guests", response_model=List[schemas.GuestResponse])
def get_card_guests(card_id: int, db: Session = Depends(get_db)):
    return db.query(models.Guest).filter(models.Guest.card_id == card_id).order_by(models.Guest.id.desc()).all()


@app.post("/api/guests", response_model=schemas.GuestResponse)
def create_guest(guest_data: schemas.GuestCreate, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    code = uuid.uuid4().hex[:8]
    guest = models.Guest(card_id=guest_data.card_id, name=guest_data.name, role=guest_data.role, phone=guest_data.phone, code=code)
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


@app.delete("/api/guests/{guest_id}")
def delete_guest(guest_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    guest = db.query(models.Guest).filter(models.Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Khách mời không tồn tại")
    db.delete(guest)
    db.commit()
    return {"message": "Đã xóa khách mời"}


@app.put("/api/guests/{guest_id}")
def update_guest(guest_id: int, guest_data: dict, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    guest = db.query(models.Guest).filter(models.Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Khách mời không tồn tại")

    if "custom_image" in guest_data:
        guest.custom_image = guest_data["custom_image"]

    db.commit()
    db.refresh(guest)
    return guest


# --- RSVPS PER CARD ---
@app.get("/api/cards/{card_id}/rsvps", response_model=List[schemas.RSVPResponse])
def get_card_rsvps(card_id: int, db: Session = Depends(get_db)):
    return db.query(models.RSVP).filter(models.RSVP.card_id == card_id).order_by(models.RSVP.id.desc()).all()


@app.post("/api/rsvps", response_model=schemas.RSVPResponse)
def create_rsvp(rsvp_data: schemas.RSVPCreate, db: Session = Depends(get_db)):
    rsvp = models.RSVP(**rsvp_data.dict())
    db.add(rsvp)
    db.commit()
    db.refresh(rsvp)
    return rsvp


@app.delete("/api/rsvps/{rsvp_id}")
def delete_rsvp(rsvp_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    rsvp = db.query(models.RSVP).filter(models.RSVP.id == rsvp_id).first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP không tồn tại")
    db.delete(rsvp)
    db.commit()
    return {"message": "Đã xóa xác nhận tham dự"}


# --- WISHES PER CARD ---
@app.get("/api/cards/{card_id}/wishes", response_model=List[schemas.WishResponse])
def get_card_wishes(card_id: int, db: Session = Depends(get_db)):
    return db.query(models.Wish).filter(models.Wish.card_id == card_id).order_by(models.Wish.id.desc()).all()


@app.post("/api/wishes", response_model=schemas.WishResponse)
def create_wish(wish_data: schemas.WishCreate, db: Session = Depends(get_db)):
    wish = models.Wish(**wish_data.dict())
    db.add(wish)
    db.commit()
    db.refresh(wish)
    return wish


@app.delete("/api/wishes/{wish_id}")
def delete_wish(wish_id: int, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    wish = db.query(models.Wish).filter(models.Wish.id == wish_id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Lời chúc không tồn tại")
    db.delete(wish)
    db.commit()
    return {"message": "Đã xóa lời chúc"}


@app.put("/api/wishes/{wish_id}")
def update_wish(wish_id: int, wish_data: dict, db: Session = Depends(get_db), _: bool = Depends(verify_admin_token)):
    wish = db.query(models.Wish).filter(models.Wish.id == wish_id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Lời chúc không tồn tại")
    
    if "is_displayed" in wish_data:
        wish.is_displayed = wish_data["is_displayed"]
    
    db.commit()
    db.refresh(wish)
    return wish


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
