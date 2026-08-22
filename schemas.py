# -*- coding: utf-8 -*-
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CardBase(BaseModel):
    slug: str
    person_name: str
    event_title: Optional[str] = "Lễ Tốt Nghiệp"
    degree_title: Optional[str] = "Cử nhân Công nghệ Thông tin"
    school_name: Optional[str] = "Trường Đại Học Giao Thông Vận Tải"
    event_date: Optional[str] = "2026-09-07T16:00:00"
    event_location: Optional[str] = "Trường Đại Học Giao Thông Vận Tải"
    event_address: Optional[str] = "Số 3 Cầu Giấy, Phường Láng, Hà Nội"
    custom_message: Optional[str] = ""
    google_maps_embed: Optional[str] = ""
    google_maps_link: Optional[str] = ""
    parking_info: Optional[str] = "[]"
    music_url: Optional[str] = ""
    hero_image: Optional[str] = "/uploads/hero_default.jpg"
    avatar_image: Optional[str] = "/uploads/avatar_default.jpg"
    theme: Optional[str] = "mystery-noir"

class CardCreate(CardBase):
    pass

class CardUpdate(CardBase):
    pass

class CardResponse(CardBase):
    id: int
    view_count: int
    created_at: datetime
    class Config:
        from_attributes = True

class PhotoCreate(BaseModel):
    card_id: int
    url: str
    caption: Optional[str] = ""

class PhotoResponse(BaseModel):
    id: int
    card_id: int
    url: str
    caption: str
    created_at: datetime
    class Config:
        from_attributes = True

class GuestCreate(BaseModel):
    card_id: int
    name: str
    role: Optional[str] = "Bạn thân"
    phone: Optional[str] = ""

class GuestResponse(BaseModel):
    id: int
    card_id: int
    name: str
    role: str
    code: str
    phone: str
    created_at: datetime
    class Config:
        from_attributes = True

class RSVPCreate(BaseModel):
    card_id: int
    guest_name: str
    phone: Optional[str] = ""
    attending: bool
    guest_count: Optional[int] = 1
    note: Optional[str] = ""

class RSVPResponse(BaseModel):
    id: int
    card_id: int
    guest_name: str
    phone: str
    attending: bool
    guest_count: int
    note: str
    created_at: datetime
    class Config:
        from_attributes = True

class WishCreate(BaseModel):
    card_id: int
    sender_name: str
    message: str
    avatar_index: Optional[int] = 1

class WishResponse(BaseModel):
    id: int
    card_id: int
    sender_name: str
    message: str
    avatar_index: int
    created_at: datetime
    class Config:
        from_attributes = True
