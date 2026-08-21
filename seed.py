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

    # 2. Card 1: Nguyen Hoai Nam (UTC)
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

    # 3. Card 2: Thuy Linh (OU)
    card2 = db.query(models.InvitationCard).filter(models.InvitationCard.slug == "thuy-linh-ttna-08").first()
    if not card2:
        card2 = models.InvitationCard(
            slug="thuy-linh-ttna-08",
            person_name="Nguyễn Thị Thùy Linh",
            event_title="Lễ Tốt Nghiệp",
            degree_title="Cử nhân Công nghệ Thông tin",
            school_name="Trường Đại học Mở Tp.HCM",
            event_date="2026-03-16T16:00:00",
            event_location="Sảnh chờ Trường ĐH Mở Tp.HCM",
            event_address="97 Võ Văn Tần, Phường Xuân Hoà, Tp.Hồ Chí Minh",
            custom_message="Khoảnh khắc này cuối cùng cũng đã tới! Ngày 16/03/2026 đánh dấu mình hoàn thành chặng đường đại học. Rất mong các cậu ghé chụp hình chung vui!",
            google_maps_embed="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3919.456215670252!2d106.690229!3d10.776328!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3ae35e3725%3A0x20c5174a47f97be3!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBN4bufIFRQLkhDTSAtIEPGoSBz4bufIDE!5e0!3m2!1svi!2sus!4v1759059036225!5m2!1svi!2sus",
            google_maps_link="https://www.google.com/maps/search/?api=1&query=Tr%C6%B0%E1%BB%9Dng+%C4%90%E1%BA%A1i+H%E1%BB%8Dc+M%E1%BB%9F+TP.HCM%2C+97+V%C3%B5+V%C4%83n+T%E1%BA%A3n%2C+Qu%E1%BA%ADn+3",
            parking_info='[{"name": "Công viên Tao Đàn", "address": "Phường Bến Thành, Quận 1, Tp.HCM", "url": "https://congvientaodan.com/maps"}]',
            music_url="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
            hero_image="/static/assets/hero_nam.webp",
            avatar_image="/uploads/avatar_default.jpg",
            theme="mystery-noir"
        )
        db.add(card2)
        db.commit()
        db.refresh(card2)

    db.commit()
    db.close()
    print("Multi-card seed data initialized successfully!")

if __name__ == "__main__":
    seed_data()
