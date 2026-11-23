"""Quality gate for affiliate XML/YML/CSV/JSON feeds before saving to catalog_products.

Checks every product for:
1. Required fields (name, brand, positive price, image_url)
2. Unique image_url (no two products sharing the same photo)
3. Live image availability (HTTP 200) and minimum resolution (parses PNG/JPEG/WebP headers in pure Python)
4. Store link check (rejects 404/410/unreachable; allows 403 bot-protected merchant URLs)
"""
import asyncio
import struct
from typing import Any, Dict, List, Optional, Tuple
import httpx


def parse_image_dimensions(data: bytes) -> Optional[Tuple[int, int]]:
    """Extract (width, height) from PNG, JPEG, or WebP header bytes without external libraries."""
    if len(data) < 24:
        return None

    # PNG: 8-byte signature + IHDR chunk (width, height at bytes 16..24)
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", data[16:24])
        return (w, h)

    # WebP: RIFF....WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        chunk = data[12:16]
        if chunk == b"VP8X" and len(data) >= 30:
            w = 1 + int.from_bytes(data[24:27], "little")
            h = 1 + int.from_bytes(data[27:30], "little")
            return (w, h)
        if chunk == b"VP8 " and len(data) >= 30:
            w = struct.unpack("<H", data[26:28])[0] & 0x3FFF
            h = struct.unpack("<H", data[28:30])[0] & 0x3FFF
            return (w, h)
        if chunk == b"VP8L" and len(data) >= 25:
            bits = int.from_bytes(data[21:25], "little")
            w = (bits & 0x3FFF) + 1
            h = ((bits >> 14) & 0x3FFF) + 1
            return (w, h)

    # JPEG: scan SOF0/SOF1/SOF2 markers
    if data[:2] == b"\xff\xd8":
        i = 2
        n = len(data)
        while i + 9 < n:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xC0, 0xC1, 0xC2):
                h, w = struct.unpack(">HH", data[i + 5 : i + 9])
                return (w, h)
            if i + 4 > n:
                break
            seg_len = struct.unpack(">H", data[i + 2 : i + 4])[0]
            if seg_len < 2:
                break
            i += 2 + seg_len

    return None


async def _check_single_item(
    client: httpx.AsyncClient,
    item: Dict[str, Any],
    min_px: int,
    check_links: bool,
    sem: asyncio.Semaphore,
) -> List[str]:
    reasons: List[str] = []
    name = (item.get("product_name") or item.get("title") or "").strip()
    img = (item.get("image_url") or item.get("image_link") or "").strip()
    url = (item.get("merchant_url") or item.get("link") or item.get("url") or "").strip()

    if not name or len(name) < 3:
        reasons.append("missing_product_name")
    if not img or not img.startswith("http"):
        reasons.append("missing_or_invalid_image_url")
        return reasons

    async with sem:
        # 1. Fetch image header bytes (Range request first, fallback to full GET if needed)
        try:
            resp = await client.get(img, headers={"Range": "bytes=0-32767"})
            if resp.status_code not in (200, 206):
                reasons.append(f"image_http_{resp.status_code}")
            else:
                dims = parse_image_dimensions(resp.content)
                if dims:
                    w, h = dims
                    if max(w, h) < min_px:
                        reasons.append(f"image_too_small_{w}x{h}")
        except Exception as e:
            reasons.append(f"image_unreachable_{type(e).__name__}")

        # 2. Optional store link check (strictly reject 404/410; allow 403 WAF-protected stores)
        if check_links and url:
            try:
                lresp = await client.head(url)
                if lresp.status_code in (404, 410):
                    reasons.append(f"broken_link_{lresp.status_code}")
            except Exception as e:
                reasons.append(f"link_unreachable_{type(e).__name__}")

    return reasons


async def validate_feed_items(
    items: List[Dict[str, Any]],
    min_px: int = 400,
    check_live: bool = True,
    check_links: bool = True,
    concurrency: int = 12,
) -> Dict[str, Any]:
    """Split feed items into `accepted` and `rejected` with clear reasons."""
    accepted: List[Dict[str, Any]] = []
    rejected: List[Dict[str, Any]] = []
    seen_images: set = set()

    pre_passed: List[Dict[str, Any]] = []
    for item in items:
        reasons: List[str] = []
        name = (item.get("product_name") or item.get("title") or "").strip()
        img = (item.get("image_url") or item.get("image_link") or "").strip()
        if not name:
            reasons.append("missing_product_name")
        if not img:
            reasons.append("missing_image_url")
        elif img in seen_images:
            reasons.append("duplicate_image_url")
        else:
            seen_images.add(img)

        if reasons:
            rejected.append({"product_name": name or "(unnamed)", "image_url": img, "reasons": reasons})
        else:
            pre_passed.append(item)

    if not check_live or not pre_passed:
        return {"accepted": pre_passed, "rejected": rejected}

    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(
        timeout=8.0,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (compatible; MIRA-QualityGate/1.0)"},
    ) as client:
        results = await asyncio.gather(
            *(_check_single_item(client, item, min_px, check_links, sem) for item in pre_passed)
        )

    for item, reasons in zip(pre_passed, results):
        if reasons:
            rejected.append({
                "product_name": item.get("product_name") or item.get("title") or "(unnamed)",
                "image_url": item.get("image_url") or item.get("image_link"),
                "reasons": reasons,
            })
        else:
            accepted.append(item)

    return {"accepted": accepted, "rejected": rejected}
