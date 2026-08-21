from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    passcode = Column(String, default="123456")

class InvitationCard(Base):
    __tablename__ = "invitation_cards"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    person_name = Column(String, nullable=False, default="Nguyễn Hoài Nam")
    event_title = Column(String, default="Lễ Tốt Nghiệp")
    degree_title = Column(String, default="Cử nhân Công nghệ Thông tin")
    school_name = Column(String, default="Trường Đại Học Giao Thông Vận Tải")
    event_date = Column(String, default="2026-09-07T16:00:00")
    event_location = Column(String, default="Trường Đại Học Giao Thông Vận Tải")
    event_address = Column(String, default="Số 3 Cầu Giấy, Phường Láng, Hà Nội")
    custom_message = Column(Text, default="Sau 77 49 37 21 ngày học tập tại trường, mình đã chính thức hoàn thành chặng đường đại học. Rất mong sự có mặt của bạn để chung vui!")
    google_maps_embed = Column(Text, default="https://maps.google.com/maps?q=Tr%C6%B0%E1%BB%9Dng%20%C4%90%E1%BA%A1i%20H%E1%BB%8Dc%20Giao%20Th%C3%B4ng%20V%E1%BA%ADn%20T%E1%BA%A3i%2C%20S%E1%BB%91%203%20C%E1%BA%A7u%20Gi%E1%BA%A5y%2C%20ph%C6%B0%E1%BB%9Dng%20L%C3%A1ng%2C%20H%C3%A0%20N%E1%BB%99i&t=&z=15&ie=UTF8&iwloc=&output=embed")
    google_maps_link = Column(String, default="https://maps.app.goo.gl/")
    parking_info = Column(Text, default='[{"name": "Bãi xe KTX Trường ĐH Giao Thông Vận Tải", "address": "Số 3 Cầu Giấy, Hà Nội", "url": ""}]')
    music_url = Column(String, default="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3")
    hero_image = Column(String, default="/uploads/hero_default.jpg")
    avatar_image = Column(String, default="/uploads/avatar_default.jpg")
    theme = Column(String, default="mystery-noir")
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    photos = relationship("Photo", back_populates="card", cascade="all, delete-orphan")
    guests = relationship("Guest", back_populates="card", cascade="all, delete-orphan")
    rsvps = relationship("RSVP", back_populates="card", cascade="all, delete-orphan")
    wishes = relationship("Wish", back_populates="card", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("invitation_cards.id"), nullable=False)
    url = Column(String, nullable=False)
    caption = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("InvitationCard", back_populates="photos")

class Guest(Base):
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("invitation_cards.id"), nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="Bạn thân")
    code = Column(String, index=True)
    phone = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("InvitationCard", back_populates="guests")

class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("invitation_cards.id"), nullable=False)
    guest_name = Column(String, nullable=False)
    phone = Column(String, default="")
    attending = Column(Boolean, default=True)
    guest_count = Column(Integer, default=1)
    note = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("InvitationCard", back_populates="rsvps")

class Wish(Base):
    __tablename__ = "wishes"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("invitation_cards.id"), nullable=False)
    sender_name = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    avatar_index = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("InvitationCard", back_populates="wishes")
