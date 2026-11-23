"""CLI script to validate and sync Trendyol / GelirOrtaklari / Admitad affiliate feed into MIRA DB.

Usage (URL or local xml/yml/csv/json file):
    ./venv/bin/python sync_affiliate_feed.py <feed_url_or_file> [MerchantName] [--no-validate]

Or set AFFILIATE_FEED_URL and AFFILIATE_MERCHANT_NAME in backend/.env and run:
    ./venv/bin/python sync_affiliate_feed.py
"""
import asyncio
import json
import os
import sys
import httpx

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.feed_importer import parse_feed_text, upsert_feed_items
from app.services.feed_validator import validate_feed_items


async def _load_feed_body(source: str) -> tuple[str, str]:
    if os.path.isfile(source):
        with open(source, "r", encoding="utf-8-sig") as f:
            return f.read(), ""
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers={"User-Agent": "MIRA-FeedImporter/1.0"}) as client:
        resp = await client.get(source)
        resp.raise_for_status()
        return resp.text, resp.headers.get("content-type", "")


async def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    skip_validate = "--no-validate" in flags

    source = args[0] if len(args) > 0 else settings.AFFILIATE_FEED_URL.strip()
    merchant = args[1] if len(args) > 1 else settings.AFFILIATE_MERCHANT_NAME.strip() or "Trendyol"
    if not source:
        print("Error: Set AFFILIATE_FEED_URL in backend/.env or pass a feed URL / local CSV-XML path.")
        sys.exit(1)

    print(f"Loading {merchant} feed from {source} ...")
    body, content_type = await _load_feed_body(source)
    items = parse_feed_text(body, merchant_name=merchant, content_type=content_type)
    print(f"Parsed {len(items)} raw items.")

    if not skip_validate:
        print("Running quality gate (unique image, HTTP 200, >=400px resolution, link check)...")
        report = await validate_feed_items(items, min_px=400, check_live=True, check_links=True)
        accepted = report["accepted"]
        rejected = report["rejected"]
        print(f"Quality gate: accepted={len(accepted)}, rejected={len(rejected)}")
        if rejected:
            report_path = os.path.join(os.path.dirname(__file__), "data", "feed_rejected_report.json")
            os.makedirs(os.path.dirname(report_path), exist_ok=True)
            with open(report_path, "w", encoding="utf-8") as rf:
                json.dump(rejected, rf, ensure_ascii=False, indent=2)
            print(f"Rejected items saved to {report_path}")
    else:
        accepted = items

    db = SessionLocal()
    try:
        res = upsert_feed_items(db, accepted, default_merchant=merchant)
        print(f"DB Sync complete: created={res['created']} updated={res['updated']} total={res['total_processed']}")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
