# backend/create_tables.py
from app.database import engine
from app.models.dataset import Base

Base.metadata.create_all(bind=engine)
print("tables created")