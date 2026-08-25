# -*- coding: utf-8 -*-
"""
Migration script to add new columns to existing database
Run this to update database schema after model changes
"""
from database import engine, SessionLocal, Base
import models
from sqlalchemy import text
import sqlalchemy


def migrate_database():
    """Add new columns to existing tables if they don't exist"""
    db = SessionLocal()
    
    try:
        # Check if inviter_name column exists in invitation_cards
        inspector = sqlalchemy.inspect(engine)
        columns_invitation_cards = [col['name'] for col in inspector.get_columns('invitation_cards')]
        
        if 'inviter_name' not in columns_invitation_cards:
            print("Adding inviter_name column to invitation_cards table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE invitation_cards ADD COLUMN inviter_name VARCHAR DEFAULT ''"))
                conn.commit()
            print("[OK] Added inviter_name column")
        else:
            print("[OK] inviter_name column already exists")
        
        # Check if is_displayed column exists in wishes
        columns_wishes = [col['name'] for col in inspector.get_columns('wishes')]
        
        if 'is_displayed' not in columns_wishes:
            print("Adding is_displayed column to wishes table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE wishes ADD COLUMN is_displayed BOOLEAN DEFAULT TRUE"))
                conn.commit()
            print("[OK] Added is_displayed column")
        else:
            print("[OK] is_displayed column already exists")
        
        # Check if custom_image column exists in guests
        columns_guests = [col['name'] for col in inspector.get_columns('guests')]
        
        if 'custom_image' not in columns_guests:
            print("Adding custom_image column to guests table...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE guests ADD COLUMN custom_image VARCHAR DEFAULT ''"))
                conn.commit()
            print("[OK] Added custom_image column")
        else:
            print("[OK] custom_image column already exists")
        
        # Update existing invitation_cards to set inviter_name from person_name if empty
        print("Updating existing invitation_cards to set inviter_name...")
        with engine.connect() as conn:
            conn.execute(text("UPDATE invitation_cards SET inviter_name = person_name WHERE inviter_name IS NULL OR inviter_name = ''"))
            conn.commit()
        print("[OK] Updated inviter_name for existing cards")
        
        print("\n[SUCCESS] Migration completed successfully!")
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_database()