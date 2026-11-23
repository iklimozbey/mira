"""CLI script to sync Trendyol / GelirOrtaklari / Admitad affiliate product feed into MIRA DB.

Usage (URL or local file path):
    ./venv/bin/python sync_affiliate_feed.py /path/to/feed.csv Trendyol

    Or:
    1. Set AFFILIATE_FEED_URL and AFFILIATE_MERCHANT_NAME in backend/.env
    2. Run: ./venv/bin/python sync_affiliate_feed.py
"""
import asyncio
import sys
from app.core.config import settings
from app.core.database import SessionLocal
import os
from app.services.feed_importer import import_feed_from_file, import_feed_from_url


async def main():
    url = sys.argv[1] if len(sys.argv) > 1 else settings.AFFILIATE_FEED_URL.strip()
    merchant = sys.argv[2] if len(sys.argv) > 2 else settings.AFFILIATE_MERCHANT_NAME.strip() or "Trendyol"
    if not url:
        print("Error: Set AFFILIATE_FEED_URL in backend/.env or pass URL as argument.")
        sys.exit(1)

    db = SessionLocal()
    try:
        print(f"Syncing {merchant} affiliate feed from {url} ...")
        if os.path.isfile(url):
            result = import_feed_from_file(db, url, merchant_name=merchant)  # local xml/yml/csv/json file
        else:
            result = await import_feed_from_url(db, url, merchant_name=merchant)
        print(f"Done: created={result['created']} updated={result['updated']} total={result['total_processed']}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
