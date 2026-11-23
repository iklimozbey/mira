"""Smart Hybrid Top-3 Recommender (Gemini 2.0 Flash / GPT-4o-mini + Rich Semantic Fallback).

Understands:
- Finish contrasts (matte vs glossy/vinyl/dewy, full-coverage vs lightweight)
- Shelf similarity ("elimdeki ürünlere benzer", "similar to my shelf", "muadil")
- Free-text shelf product inference (e.g. "T-Zone Oil Eraser" -> oil_control, pore_minimizing, matte)
- Budget constraints from prompt or profile
- Decision/recommendation reasoning tailored to user's skin profile & shelf
"""
import json
import re
from typing import Any, Dict, List, Optional, Set
import httpx

from app.core.config import settings
from app.services.catalog_service import POPULAR_BRAND_CATALOG

# Structured attribute profiles for each catalog item so finish/benefit contrasts work accurately.
PRODUCT_ATTRIBUTES: Dict[str, Dict[str, Any]] = {
    "Flormar Kiss Me More Lip Tattoo": {
        "finish": "matte",
        "benefits": {"long_wear", "transfer_proof", "matte"},
    },
    "Flormar Water Lip Stain": {
        "finish": "natural",
        "benefits": {"lightweight", "natural", "tint", "long_wear"},
    },
    "Maybelline SuperStay Vinyl Ink": {
        "finish": "glossy",
        "benefits": {"glossy", "shiny", "long_wear", "transfer_proof"},
    },
    "Maybelline Lifter Gloss": {
        "finish": "glossy",
        "benefits": {"glossy", "shiny", "hydrating", "plumping", "dry_skin"},
    },
    "Maybelline SuperStay Matte Ink": {
        "finish": "matte",
        "benefits": {"matte", "long_wear", "transfer_proof"},
    },
    "Kiko 3D Hydra Lipgloss": {
        "finish": "glossy",
        "benefits": {"glossy", "shiny", "hydrating", "plumping"},
    },
    "Golden Rose Velvet Matte Lipstick": {
        "finish": "matte",
        "benefits": {"matte", "velvet", "pigmented"},
    },
    "Flormar Precious Curl Mascara": {
        "finish": "natural",
        "benefits": {"curling", "lifting"},
    },
    "Flormar Hero Volume & Curl Mascara": {
        "finish": "natural",
        "benefits": {"volumizing", "curling"},
    },
    "Maybelline Sky High Mascara": {
        "finish": "natural",
        "benefits": {"lengthening", "lightweight"},
    },
    "Maybelline Lash Sensational Fan": {
        "finish": "natural",
        "benefits": {"volumizing", "separating"},
    },
    "L'Oreal Telescopic Mascara": {
        "finish": "natural",
        "benefits": {"lengthening", "separating"},
    },
    "Flormar Perfect Coverage Foundation": {
        "finish": "matte",
        "benefits": {"high_coverage", "long_wear", "blemish_cover"},
    },
    "Maybelline Fit Me Matte + Poreless": {
        "finish": "matte",
        "benefits": {"matte", "oil_control", "pore_minimizing", "oily_skin", "sebum"},
    },
    "L'Oreal Infallible 24H Fresh Wear": {
        "finish": "satin",
        "benefits": {"long_wear", "lightweight", "natural", "combination_skin"},
    },
    "La Roche-Posay Anthelios UVMune 400": {
        "finish": "natural",
        "benefits": {"spf", "lightweight", "oil_control", "sensitive_skin", "oily_skin"},
    },
    "La Roche-Posay Cicaplast Baume B5+": {
        "finish": "dewy",
        "benefits": {"barrier_repair", "soothing", "redness", "sensitive_skin", "dry_skin", "hydrating"},
    },
    "CeraVe Moisturizing Cream": {
        "finish": "natural",
        "benefits": {"hydrating", "barrier_repair", "dry_skin", "sensitive_skin"},
    },
    "The Ordinary Niacinamide 10% + Zinc 1%": {
        "finish": "matte",
        "benefits": {"oil_control", "sebum", "pore_minimizing", "acne_care", "oily_skin", "matte"},
    },
    "The Ordinary Hyaluronic Acid 2% + B5": {
        "finish": "dewy",
        "benefits": {"hydrating", "plumping", "dry_skin", "barrier_repair"},
    },
}

_CATEGORY_KEYWORDS = {
    "lip": ["ruj", "lip", "lipstick", "gloss", "tint", "dudak", "parlatici", "parlatıcı", "balm"],
    "foundation": ["fondöten", "fondoten", "foundation", "kapatıcı", "kapatici", "ten", "bb", "cc"],
    "mascara": ["maskara", "mascara", "rimel", "kirpik", "lash"],
    "sunscreen": ["güneş", "gunes", "sunscreen", "spf", "uv", "güneş kremi"],
    "moisturizer": ["nemlendirici", "krem", "moisturizer", "cream", "bariyer", "barrier", "balm"],
    "serum": ["serum", "niacinamide", "hyaluronic", "leke", "asit", "tonik", "toner", "oil eraser", "eraser"],
}

_ATTRIBUTE_KEYWORDS = {
    "glossy": ["parlak", "gloss", "glossy", "shiny", "ışıltı", "isilti", "cam", "vinyl", "parlatıcı", "parlatici", "ıslak", "islak", "nemli"],
    "matte": ["mat", "matte", "kadife", "velvet", "parlamayan", "pudra"],
    "oil_control": ["yağ", "yag", "oil", "sebum", "t-zone", "t zone", "t bölgesi", "parlama", "eraser", "yağlı", "yagli", "oily"],
    "pore_minimizing": ["gözenek", "gozenek", "pore", "poreless", "siyah nokta", "t-zone"],
    "acne_care": ["akne", "acne", "sivilce", "blemish", "salicylic", "niacinamide", "zinc"],
    "hydrating": ["nem", "nemlendirici", "kuru", "dry", "hydrat", "hyaluronic", "plump", "dolgun"],
    "barrier_repair": ["bariyer", "barrier", "onar", "yatıştır", "yatistir", "sooth", "roza", "rosacea", "kızarıklık", "kizariklik", "hassas", "sensitive"],
    "long_wear": ["kalıcı", "kalici", "long", "24h", "16", "bulaşma", "bulasma", "transfer"],
    "curling": ["kıvır", "kivir", "curl", "lift"],
    "volumizing": ["hacim", "volume", "dolgun"],
    "lengthening": ["uzat", "length", "telescopic", "sky high"],
    "high_coverage": ["tam kapatıcı", "yüksek kapatıcı", "high coverage", "full coverage", "leke kapat"],
    "lightweight": ["hafif", "lightweight", "doğal", "dogal", "ince", "fresh"],
}

_SHELF_SIMILARITY_TRIGGERS = [
    "elimdeki", "dolabımdaki", "dolabimdaki", "rafımdaki", "rafimdaki",
    "ürünlere benzer", "urunlere benzer", "rünlere benzer", "benzer ürün", "benzer urun",
    "muadil", "similar to my", "like my shelf", "my shelf", "what i own", "products i have",
]


def _extract_budget(prompt: str) -> Optional[int]:
    m = re.search(r"(\d{2,5})\s*(?:tl|try|lira|₺|\$|altı|alti|under|max|bütçe|butce)?", prompt.lower())
    if m:
        val = int(m.group(1))
        if 50 <= val <= 20000:
            return val
    return None


def _extract_attributes(text: str) -> Set[str]:
    lower = text.lower()
    found: Set[str] = set()
    for attr, kws in _ATTRIBUTE_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            found.add(attr)
    return found


def _extract_categories(text: str) -> Set[str]:
    lower = text.lower()
    found: Set[str] = set()
    for cat, kws in _CATEGORY_KEYWORDS.items():
        if any(kw in lower for kw in kws):
            found.add(cat)
    return found


def _infer_shelf_profile(inventory: List[Any]) -> Dict[str, Any]:
    """Infer benefits, categories, and names from whatever the user has on their shelf."""
    names: List[str] = []
    attrs: Set[str] = set()
    cats: Set[str] = set()
    for item in inventory:
        name = (getattr(item, "product_name", "") or "").strip()
        brand = (getattr(item, "brand", "") or "").strip()
        cat = (getattr(item, "category", "") or "").strip().lower()
        if not name:
            continue
        names.append(name)
        combined = f"{name} {brand} {cat}"
        attrs |= _extract_attributes(combined)
        if cat and cat != "other":
            cats.add(cat)
        cats |= _extract_categories(combined)
        # If it's a known catalog product, include its structured attributes too
        if name in PRODUCT_ATTRIBUTES:
            attrs |= PRODUCT_ATTRIBUTES[name]["benefits"]
    return {"names": names, "attrs": attrs, "cats": cats}


def _deterministic_top3(
    prompt: Optional[str],
    profile_dict: Dict[str, Any],
    inventory: List[Any],
    lang: str,
) -> Dict[str, Any]:
    prompt_lower = (prompt or "").lower().strip()
    shelf_info = _infer_shelf_profile(inventory)
    owned_lower = {n.lower() for n in shelf_info["names"]}

    asks_shelf_similar = any(trig in prompt_lower for trig in _SHELF_SIMILARITY_TRIGGERS)
    wanted_cats = _extract_categories(prompt_lower)
    wanted_attrs = _extract_attributes(prompt_lower)

    # If user explicitly asked for products similar to their shelf, pull attributes & categories from shelf!
    if asks_shelf_similar:
        wanted_attrs |= shelf_info["attrs"]
        if not wanted_cats:
            wanted_cats |= shelf_info["cats"]

    prompt_budget = _extract_budget(prompt_lower) if prompt_lower else None
    budget_max = prompt_budget or profile_dict.get("budget_max")
    skin_type = (profile_dict.get("skin_type") or "").lower()
    concerns = [c.lower() for c in (profile_dict.get("skin_concerns") or [])]

    scored = []
    for item in POPULAR_BRAND_CATALOG:
        name = item["product_name"]
        cat = item["category"]
        price = int(item.get("price", 400))
        meta = PRODUCT_ATTRIBUTES.get(name, {"finish": "natural", "benefits": set()})
        item_finish = meta["finish"]
        item_benefits: Set[str] = set(meta["benefits"])

        score = int(item.get("rating", 4.5) * 12)  # Base ~54-58
        reasons_en: List[str] = []
        reasons_tr: List[str] = []

        # 1. Category alignment
        if wanted_cats:
            if cat in wanted_cats:
                score += 24
            else:
                score -= 22

        # 2. Finish contrast (crucial: glossy vs matte!)
        if "glossy" in wanted_attrs and "matte" not in wanted_attrs:
            if item_finish == "glossy" or "glossy" in item_benefits:
                score += 30
                reasons_en.append("Glossy, luminous finish as requested")
                reasons_tr.append("İstediğiniz gibi parlak bitişli")
            elif item_finish == "matte":
                score -= 28
        elif "matte" in wanted_attrs and "glossy" not in wanted_attrs:
            if item_finish == "matte" or "matte" in item_benefits:
                score += 30
                reasons_en.append("Matte finish as requested")
                reasons_tr.append("İstediğiniz gibi mat bitişli")
            elif item_finish == "glossy":
                score -= 28

        # 3. Benefit & shelf-similarity overlap
        overlap = wanted_attrs & item_benefits
        if overlap:
            score += min(32, len(overlap) * 14)
            if asks_shelf_similar and shelf_info["names"]:
                ref = shelf_info["names"][0]
                reasons_en.append(f"Similar effect to your {ref}")
                reasons_tr.append(f"Dolabınızdaki {ref} ile benzer etkili")
            elif "oil_control" in overlap or "pore_minimizing" in overlap:
                reasons_en.append("Controls oil and minimizes pores")
                reasons_tr.append("Yağ ve gözenek kontrolü sağlar")
            elif "hydrating" in overlap or "barrier_repair" in overlap:
                reasons_en.append("Hydrates and supports skin barrier")
                reasons_tr.append("Nemlendirir ve cilt bariyerini destekler")
            elif "curling" in overlap or "volumizing" in overlap or "lengthening" in overlap:
                reasons_en.append("Matches your lash effect preference")
                reasons_tr.append("İstediğiniz kirpik etkisine uygun")

        # 4. Skin profile fit
        if skin_type == "oily" and ("oil_control" in item_benefits or "oily_skin" in item_benefits):
            score += 8
        elif skin_type == "dry" and ("hydrating" in item_benefits or "dry_skin" in item_benefits):
            score += 8
        elif skin_type == "sensitive" and ("sensitive_skin" in item_benefits or "barrier_repair" in item_benefits):
            score += 8

        for c in concerns:
            if c in ("acne", "pores") and ("acne_care" in item_benefits or "pore_minimizing" in item_benefits):
                score += 6
            elif c in ("rosacea", "redness", "eczema") and ("barrier_repair" in item_benefits or "soothing" in item_benefits):
                score += 6

        # 5. Budget fit
        if budget_max and budget_max > 0:
            if price <= budget_max:
                score += 8
                if not reasons_en:
                    reasons_en.append(f"Fits your {budget_max} TL budget")
                    reasons_tr.append(f"{budget_max} TL bütçenize uygun")
            else:
                score -= 24

        # 6. Do not suggest exact product already owned
        if name.lower() in owned_lower:
            score -= 40

        clamped = max(55, min(98, score))
        scored.append((
            clamped,
            item,
            reasons_tr[0] if reasons_tr else "Cilt profiliniz için yüksek puanlı seçim",
            reasons_en[0] if reasons_en else "Top-rated match for your profile",
        ))

    scored.sort(key=lambda x: (x[0], x[1]["rating"], x[1]["review_count"]), reverse=True)
    top3 = scored[:3]

    products = [
        {**item, "fit_score": s, "match_reason": r_tr if lang == "tr" else r_en}
        for s, item, r_tr, r_en in top3
    ]

    # Craft decisive, context-aware reply
    best = products[0]["product_name"] if products else ""
    if asks_shelf_similar:
        if shelf_info["names"]:
            ref_list = ", ".join(shelf_info["names"][:2])
            if lang == "tr":
                reply = f"Dolabınızdaki {ref_list} ürünüyle benzer etki ve kategorideki en uyumlu 3 alternatifi seçtim. İlk önerim: {best}."
            else:
                reply = f"Based on {ref_list} on your shelf, here are the 3 closest alternatives. Top pick: {best}."
        else:
            reply = (
                "Dolabınızda henüz ürün yok, cilt profilinize göre en uyumlu 3 ürünü listeledim:"
                if lang == "tr"
                else "Your shelf is empty right now, so here are the 3 best matches for your skin profile:"
            )
    elif prompt_lower:
        if "glossy" in wanted_attrs and "matte" not in wanted_attrs:
            reply = (
                f"Parlak ve ışıltılı bitiş isteğinize göre en uyumlu 3 ürünü ayırdım. Öncelikli önerim: {best}."
                if lang == "tr"
                else f"Filtered for a glossy, luminous finish. My top pick for you is {best}."
            )
        elif "matte" in wanted_attrs and "glossy" not in wanted_attrs:
            reply = (
                f"Mat bitiş tercihinize göre en kalıcı 3 ürünü seçtim. Öncelikli önerim: {best}."
                if lang == "tr"
                else f"Filtered for a matte finish. My top pick for you is {best}."
            )
        else:
            reply = (
                f"İsteğinize, cilt profilinize ve bütçenize göre en mantıklı 3 seçenek — ilk tercihim {best}:"
                if lang == "tr"
                else f"Top 3 matches for your request, skin profile, and budget — my #1 pick is {best}:"
            )
    else:
        reply = (
            "Bugün cilt profiliniz ve bütçeniz için öne çıkan 3 öneri:"
            if lang == "tr"
            else "Today's top 3 picks tailored to your skin profile and budget:"
        )

    return {"reply": reply, "products": products}


async def _try_llm_top3(
    prompt: str,
    profile_dict: Dict[str, Any],
    shelf_items: List[Dict[str, Any]],
    history: List[Dict[str, str]],
    lang: str,
) -> Optional[Dict[str, Any]]:
    gemini_key = (settings.GEMINI_API_KEY or "").strip()
    openai_key = (settings.OPENAI_API_KEY or "").strip()
    if not gemini_key and not openai_key:
        return None

    compact_catalog = [
        {
            "product_name": p["product_name"],
            "brand": p["brand"],
            "category": p["category"],
            "price": p.get("price", 400),
            "rating": p["rating"],
            "finish": PRODUCT_ATTRIBUTES.get(p["product_name"], {}).get("finish", "natural"),
            "benefits": sorted(PRODUCT_ATTRIBUTES.get(p["product_name"], {}).get("benefits", set())),
        }
        for p in POPULAR_BRAND_CATALOG
    ]
    sys_prompt = (
        f"You are MIRA, a smart, decisive beauty advisor. Language: {'Turkish' if lang == 'tr' else 'English'}. "
        f"User skin profile: {json.dumps(profile_dict)}. "
        f"User's current shelf (products they own/tested): {json.dumps(shelf_items)}. "
        f"Recent conversation: {json.dumps(history[-4:])}. "
        f"User message: {prompt!r}. "
        f"Catalog (pick ONLY from these exact product_name values): {json.dumps(compact_catalog)}. "
        "Rules: Respect finish requests strictly (glossy != matte). If the user asks for products similar to their shelf, infer the function/ingredients of their shelf products (even if not in catalog, e.g. T-Zone Oil Eraser = oil & pore control) and pick the 3 closest catalog alternatives. Make a clear #1 decision in your reply. "
        'Return strict JSON: {"reply": "1-2 decisive sentences", "picks": [{"product_name": "exact name", "fit_score": 94, "match_reason": "short specific reason"}]}. No emoji.'
    )

    try:
        raw_text = ""
        async with httpx.AsyncClient(timeout=12.0) as client:
            if gemini_key:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                r = await client.post(url, json={"contents": [{"parts": [{"text": sys_prompt}]}]})
                if r.status_code == 200:
                    raw_text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            elif openai_key:
                r = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}"},
                    json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": sys_prompt}], "temperature": 0.3},
                )
                if r.status_code == 200:
                    raw_text = r.json()["choices"][0]["message"]["content"]

        if not raw_text:
            return None

        cleaned = re.sub(r"^```(?:json)?|```$", "", raw_text.strip(), flags=re.MULTILINE).strip()
        parsed = json.loads(cleaned)
        picks = parsed.get("picks") or []
        by_name = {p["product_name"]: p for p in POPULAR_BRAND_CATALOG}
        products = []
        for pick in picks:
            item = by_name.get(pick.get("product_name"))
            if item:
                products.append({
                    **item,
                    "fit_score": int(pick.get("fit_score", 88)),
                    "match_reason": str(pick.get("match_reason", "")),
                })
        if len(products) == 3:
            return {"reply": str(parsed.get("reply", "")), "products": products}
    except Exception:
        return None
    return None


async def recommend_top3(
    prompt: Optional[str],
    profile: Any,
    inventory: List[Any],
    lang: str = "en",
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    profile_dict = {
        "skin_type": getattr(profile, "skin_type", None) if profile else None,
        "skin_undertone": getattr(profile, "skin_undertone", None) if profile else None,
        "skin_concerns": getattr(profile, "skin_concerns", []) if profile else [],
        "allergies_sensitivities": getattr(profile, "allergies_sensitivities", []) if profile else [],
        "budget_max": getattr(profile, "budget_max", None) if profile else None,
    }
    shelf_items = [
        {
            "product_name": getattr(i, "product_name", ""),
            "brand": getattr(i, "brand", ""),
            "category": getattr(i, "category", ""),
            "status": getattr(i, "status", "owned"),
        }
        for i in inventory
    ]

    if prompt and prompt.strip():
        llm_res = await _try_llm_top3(prompt.strip(), profile_dict, shelf_items, history or [], lang)
        if llm_res:
            return llm_res

    return _deterministic_top3(prompt, profile_dict, inventory, lang)
