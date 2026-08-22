# -*- coding: utf-8 -*-
import os
from database import SessionLocal, engine, Base
import models

def seed_data():
    # Re-create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Admin
    admin = db.query(models.AdminUser).first()
    if not admin:
        admin = models.AdminUser(passcode="123456")
        db.add(admin)

    # 2. Card 1: Nguyễn Hoài Nam (UTC)
    card1 = db.query(models.InvitationCard).filter(models.InvitationCard.slug == "nguyen-hoai-nam-f6034e").first()
    if not card1:
        card1 = models.InvitationCard(
            slug="nguyen-hoai-nam-f6034e",
            person_name="Nguyễn Hoài Nam",
            event_title="Lễ Tốt Nghiệp",
            degree_title="Kỹ sư Cầu Đường",
            school_name="Trường Đại Học Giao Thông Vận Tải",
            event_date="2026-09-07T16:00:00",
            event_location="Trường Đại Học Giao Thông Vận Tải",
            event_address="Số 3 Cầu Giấy, Phường Láng, Hà Nội",
            custom_message="Sau 77 49 37 21 ngày ăn chơi tại UTC, Nguyễn Nam đã chính thức được đá ra khỏi trường. Rất mong có sự hiện diện của những người thương yêu để cùng chứng kiến khoảnh khắc chẳng mấy huy hoàng nhưng lại không thể thiếu này nhé.",
            google_maps_embed="https://maps.google.com/maps?q=Tr%C6%B0%E1%BB%9Dng%20%C4%90%E1%BA%A1i%20H%E1%BB%8Dc%20Giao%20Th%C3%B4ng%20V%E1%BA%ADn%20T%E1%BA%A3i%2C%20S%E1%BB%91%203%20C%E1%BA%A7u%20Gi%E1%BA%A5y%2C%20ph%C6%B0%E1%BB%9Dng%20L%C3%A1ng%2C%20H%E1%BA%A0%20N%E1%BB%99i&t=&z=15&ie=UTF8&iwloc=&output=embed",
            google_maps_link="https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+H%E1%BB%8Dc+Giao+Th%C3%B4ng+V%E1%BA%ADn+T%E1%BA%A3i%2C+S%E1%BB%91+3+C%E1%BA%A7u+Gi%E1%BA%A5y%2C+H%C3%A0+N%E1%BB%99i",
            parking_info='[{"name": "Bãi xe KTX Trường ĐH Giao Thông Vận Tải", "address": "Số 3 Cầu Giấy, Hà Nội", "url": ""}]',
            music_url="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
            hero_image="/static/assets/hero_nam.webp",
            avatar_image="/uploads/avatar_default.jpg",
            theme="mystery-noir"
        )
        db.add(card1)
        db.commit()
        db.refresh(card1)

        # Seed photos for Card 1
        photos1 = [
            models.Photo(card_id=card1.id, url="/static/assets/hero_nam.webp", caption="Nam rạng rỡ ngày lễ tốt nghiệp")
        ]
        db.add_all(photos1)

        # Seed guests for Card 1
        guests1 = [
            models.Guest(card_id=card1.id, name="Anh Tuấn", role="Bạn thân", code="tuan-utc", phone="0901234567"),
            models.Guest(card_id=card1.id, name="Hoàng Nam", role="Bạn cùng lớp", code="nam-utc", phone="0912345678")
        ]
        db.add_all(guests1)

        # Seed wishes for Card 1
        wishes1 = [
            models.Wish(card_id=card1.id, sender_name="Hoàng Nam", message="Chúc mừng Nam bro đã chính thức rời UTC thành công rực rỡ! 🎉🎓", avatar_index=1),
            models.Wish(card_id=card1.id, sender_name="Bích Phương", message="Chúc cậu tương lai rộng mở, sớm trở thành kỹ sư giỏi nhé! ✨🌟", avatar_index=2)
        ]
        db.add_all(wishes1)

    db.commit()
    db.close()
    print("Multi-card seed data initialized successfully!")

if __name__ == "__main__":
    seed_data()
