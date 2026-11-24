"""Smart Offline-First Hybrid Top-3 Recommender with Strict Hard Constraints.

Pipeline:
1. Hard Constraints FIRST (never violated):
   - Explicit prompt budget ("300 tl alti", "under 300") -> strictly price <= budget
   - Explicit category ("ruj", "fondoten", "serum") -> strictly matching category
   - Explicit finish ("saten", "mat", "parlak", "nemli") -> strictly matching finish
   - Explicit negations ("mat olmasin", "parlak istemiyorum") -> strictly excluded
   - Owned exact duplicates -> excluded
2. Soft Ranking SECOND (among candidates that passed all hard constraints):
   - Skin profile & concerns fit, shelf-similarity benefits, character 3-gram cosine similarity,
     profile budget preference, rating & review volume.
3. Honest output: returns up to 3 strictly valid matches (never pads with violating products).
"""
import json
import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Set
import httpx

from app.core.config import settings
from app.services.catalog_service import POPULAR_BRAND_CATALOG

PRODUCT_ATTRIBUTES: Dict[str, Dict[str, Any]] = {
    "Flormar Kiss Me More Lip Tattoo": {"finish": "matte", "benefits": {"long_wear", "transfer_proof", "matte"}},
    "Flormar Water Lip Stain": {"finish": "natural", "benefits": {"lightweight", "natural", "tint", "long_wear"}},
    "Maybelline SuperStay Vinyl Ink": {"finish": "glossy", "benefits": {"glossy", "shiny", "long_wear", "transfer_proof"}},
    "Maybelline Lifter Gloss": {"finish": "glossy", "benefits": {"glossy", "shiny", "hydrating", "plumping", "dry_skin"}},
    "Maybelline SuperStay Matte Ink": {"finish": "matte", "benefits": {"matte", "long_wear", "transfer_proof"}},
    "Kiko 3D Hydra Lipgloss": {"finish": "glossy", "benefits": {"glossy", "shiny", "hydrating", "plumping"}},
    "Golden Rose Velvet Matte Lipstick": {"finish": "matte", "benefits": {"matte", "velvet", "pigmented"}},
    "Pastel Classic Satin Lipstick": {"finish": "satin", "benefits": {"satin", "creamy", "hydrating", "dry_skin"}},
    "Maybelline Color Sensational Satin Lipstick": {"finish": "satin", "benefits": {"satin", "creamy", "hydrating", "dry_skin"}},
    "Flormar Deluxe Cashmere Stylo Satin": {"finish": "satin", "benefits": {"satin", "creamy", "pigmented"}},
    "Flormar Precious Curl Mascara": {"finish": "natural", "benefits": {"curling", "lifting"}},
    "Flormar Hero Volume & Curl Mascara": {"finish": "natural", "benefits": {"volumizing", "curling"}},
    "Maybelline Sky High Mascara": {"finish": "natural", "benefits": {"lengthening", "lightweight"}},
    "Maybelline Lash Sensational Fan": {"finish": "natural", "benefits": {"volumizing", "separating"}},
    "L'Oreal Telescopic Mascara": {"finish": "natural", "benefits": {"lengthening", "separating"}},
    "Flormar Perfect Coverage Foundation": {"finish": "matte", "benefits": {"high_coverage", "long_wear", "blemish_cover", "matte"}},
    "Maybelline Fit Me Matte + Poreless": {"finish": "matte", "benefits": {"matte", "oil_control", "pore_minimizing", "oily_skin", "sebum"}},
    "L'Oreal Infallible 24H Fresh Wear": {"finish": "satin", "benefits": {"satin", "long_wear", "lightweight", "natural", "combination_skin"}},
    "Note Luminous Moisturizing Satin Foundation": {"finish": "satin", "benefits": {"satin", "hydrating", "dry_skin", "natural"}},
    "La Roche-Posay Anthelios UVMune 400": {"finish": "natural", "benefits": {"spf", "lightweight", "oil_control", "sensitive_skin", "oily_skin"}},
    "La Roche-Posay Cicaplast Baume B5+": {"finish": "dewy", "benefits": {"barrier_repair", "soothing", "redness", "sensitive_skin", "dry_skin", "hydrating"}},
    "CeraVe Moisturizing Cream": {"finish": "natural", "benefits": {"hydrating", "barrier_repair", "dry_skin", "sensitive_skin"}},
    "The Ordinary Niacinamide 10% + Zinc 1%": {"finish": "matte", "benefits": {"oil_control", "sebum", "pore_minimizing", "acne_care", "oily_skin", "matte"}},
    "The Ordinary Hyaluronic Acid 2% + B5": {"finish": "dewy", "benefits": {"hydrating", "plumping", "dry_skin", "barrier_repair"}},
    "The Purest Solutions Niacinamide 5% Serum": {"finish": "matte", "benefits": {"oil_control", "sebum", "pore_minimizing", "acne_care", "oily_skin"}},
    "Garnier Vitamin C Brightening Serum": {"finish": "natural", "benefits": {"brightening", "lightweight", "natural", "hydrating"}},
}

_CATEGORY_KEYWORDS = {
    "lip": ["ruj", "lip", "lipstick", "gloss", "tint", "dudak", "parlatici", "parlatıcı", "balm"],
    "foundation": ["fondöten", "fondoten", "foundation", "kapatıcı", "kapatici", "ten", "bb", "cc"],
    "mascara": ["maskara", "mascara", "rimel", "kirpik", "lash"],
    "sunscreen": ["güneş", "gunes", "sunscreen", "spf", "uv", "güneş kremi"],
    "moisturizer": ["nemlendirici", "krem", "moisturizer", "cream", "bariyer", "barrier", "balm"],
    "serum": ["serum", "niacinamide", "hyaluronic", "leke", "asit", "tonik", "toner", "oil eraser", "eraser", "c vitamini", "vitamin c"],
}

_FINISH_KEYWORDS = {
    "satin": ["saten", "satin", "kremsi", "creamy", "ipeksi", "yarı mat", "yari mat", "semi-matte"],
    "glossy": ["parlak", "gloss", "glossy", "shiny", "ışıltı", "isilti", "cam", "vinyl", "parlatıcı", "parlatici", "ıslak", "islak"],
    "matte": ["mat", "matte", "kadife", "velvet", "parlamayan", "pudra"],
    "dewy": ["dewy", "glow", "nemli bitiş", "nemli bitis"],
}

_ATTRIBUTE_KEYWORDS = {
    **_FINISH_KEYWORDS,
    "oil_control": ["yağ", "yag", "oil", "sebum", "t-zone", "t zone", "t bölgesi", "parlama", "eraser", "erasser", "yağlı", "yagli", "oily"],
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
    "brightening": ["leke", "aydınlat", "aydinlat", "c vitamini", "vitamin c", "bright"],
}

_SHELF_SIMILARITY_TRIGGERS = [
    "elimdeki", "dolabımdaki", "dolabimdaki", "rafımdaki", "rafimdaki",
    "ürünlere benzer", "urunlere benzer", "rünlere benzer", "benzer ürün", "benzer urun",
    "muadil", "similar to my", "like my shelf", "my shelf", "what i own", "products i have",
]

_ROUTINE_GAP_TRIGGERS = [
    "ne eksik", "eksik olan", "rutinimde", "rutinime", "what am i missing", "missing from", "routine gap", "ne almalıyım", "ne almaliyim",
]

_CHEAP_TRIGGERS = ["ucuz", "uygun fiyat", "ekonomik", "bütçe dostu", "cheap", "affordable", "budget-friendly"]
_NEGATIONS = {
    "matte": ["mat olmasın", "mat olmasin", "mat istemiyorum", "mat değil", "not matte", "no matte"],
    "glossy": ["parlak olmasın", "parlak olmasin", "parlak istemiyorum", "not glossy", "no gloss"],
    "satin": ["saten olmasın", "saten olmasin", "not satin"],
}


def _ngrams(text: str, n: int = 3) -> Counter:
    cleaned = re.sub(r"[^a-zçğıöşü0-9]+", " ", text.lower()).strip()
    return Counter(cleaned[i : i + n] for i in range(max(0, len(cleaned) - n + 1)))


def _cosine_sim(a: str, b: str) -> float:
    ca, cb = _ngrams(a), _ngrams(b)
    if not ca or not cb:
        return 0.0
    dot = sum(ca[k] * cb[k] for k in ca.keys() & cb.keys())
    denom = math.sqrt(sum(v * v for v in ca.values())) * math.sqrt(sum(v * v for v in cb.values()))
    return dot / denom if denom else 0.0


def _extract_budget(prompt: str) -> Optional[int]:
    m = re.search(r"(\d{2,5})\s*(?:tl|try|lira|₺|\$|altı|alti|under|max|bütçe|butce)?", prompt.lower())
    if m:
        val = int(m.group(1))
        if 50 <= val <= 20000:
            return val
    return None


def _word_match(kw: str, text: str) -> bool:
    if " " in kw:
        return kw in text
    return bool(re.search(rf"(?<![a-zçğıöşü]){re.escape(kw)}", text))


def _extract_negated(text: str) -> Set[str]:
    lower = text.lower()
    return {attr for attr, phrases in _NEGATIONS.items() if any(p in lower for p in phrases)}


def _extract_finishes(text: str, negated: Set[str]) -> Set[str]:
    lower = text.lower()
    # Strip negated phrases before detecting wanted finishes so "mat olmasın" doesn't trigger matte
    cleaned = lower
    for phrases in _NEGATIONS.values():
        for p in phrases:
            cleaned = cleaned.replace(p, " ")
    found = {fin for fin, kws in _FINISH_KEYWORDS.items() if any(_word_match(kw, cleaned) for kw in kws)}
    # If user says "yarı mat" (satin), don't also trigger "matte"
    if "satin" in found and ("yarı mat" in cleaned or "yari mat" in cleaned or "semi-matte" in cleaned):
        found.discard("matte")
    return found - negated


def _extract_attributes(text: str) -> Set[str]:
    lower = text.lower()
    negated = _extract_negated(lower)
    cleaned = lower
    for phrases in _NEGATIONS.values():
        for p in phrases:
            cleaned = cleaned.replace(p, " ")
    found = {attr for attr, kws in _ATTRIBUTE_KEYWORDS.items() if any(_word_match(kw, cleaned) for kw in kws)}
    return found - negated


def _extract_categories(text: str) -> Set[str]:
    lower = text.lower()
    return {cat for cat, kws in _CATEGORY_KEYWORDS.items() if any(_word_match(kw, lower) for kw in kws)}


def _infer_shelf_profile(inventory: List[Any]) -> Dict[str, Any]:
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
        if name in PRODUCT_ATTRIBUTES:
            attrs |= PRODUCT_ATTRIBUTES[name]["benefits"]
    return {"names": names, "attrs": attrs, "cats": cats}


def _deterministic_top3(
    prompt: Optional[str],
    profile_dict: Dict[str, Any],
    inventory: List[Any],
    lang: str,
    catalog_items: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    source_catalog = catalog_items if catalog_items is not None else POPULAR_BRAND_CATALOG
    prompt_lower = (prompt or "").lower().strip()
    shelf_info = _infer_shelf_profile(inventory)
    owned_lower = {n.lower() for n in shelf_info["names"]}

    asks_shelf_similar = any(trig in prompt_lower for trig in _SHELF_SIMILARITY_TRIGGERS)
    asks_routine_gap = any(trig in prompt_lower for trig in _ROUTINE_GAP_TRIGGERS)
    wants_cheap = any(trig in prompt_lower for trig in _CHEAP_TRIGGERS)

    negated_finishes = _extract_negated(prompt_lower)
    explicit_cats = _extract_categories(prompt_lower)
    explicit_finishes = _extract_finishes(prompt_lower, negated_finishes)
    prompt_budget = _extract_budget(prompt_lower) if prompt_lower else None
    profile_budget = profile_dict.get("budget_max")

    wanted_attrs = _extract_attributes(prompt_lower)
    if asks_shelf_similar:
        wanted_attrs |= shelf_info["attrs"]

    soft_cats = set(explicit_cats)
    if asks_shelf_similar and not explicit_cats:
        soft_cats |= shelf_info["cats"]
    if asks_routine_gap:
        missing_core = {"sunscreen", "moisturizer", "serum"} - shelf_info["cats"]
        soft_cats |= missing_core

    skin_type = (profile_dict.get("skin_type") or "").lower()
    concerns = [c.lower() for c in (profile_dict.get("skin_concerns") or [])]

    # ==========================================================
    # STAGE 1: STRICT HARD FILTERING (never violate explicit user constraints)
    # ==========================================================
    effective_budget = prompt_budget if prompt_budget is not None else profile_budget
    candidates = []
    for item in source_catalog:
        name = item["product_name"]
        cat = item["category"]
        price = int(item.get("price", 400))
        meta = PRODUCT_ATTRIBUTES.get(name)
        item_finish = item.get("finish") or (meta["finish"] if meta else "natural")

        # Exclude exact owned products
        if name.lower() in owned_lower:
            continue
        # Hard Budget Filter (from prompt OR user's saved profile budget — never exceed!)
        if effective_budget is not None and effective_budget > 0 and price > effective_budget:
            continue
        # Hard Category Filter (explicitly typed in prompt, e.g. "ruj")
        if explicit_cats and cat not in explicit_cats:
            continue
        # Hard Finish Filter (explicitly typed in prompt, e.g. "saten", "parlak", "mat")
        if explicit_finishes and item_finish not in explicit_finishes:
            continue
        # Hard Negation Filter (e.g. "mat olmasin")
        if item_finish in negated_finishes:
            continue

        candidates.append(item)

    if not candidates:
        if lang == "tr":
            budget_note = f" ({effective_budget} TL altı)" if effective_budget else ""
            reply = f"Katalogda belirttiğiniz tüm kriterlere{budget_note} tam uyan ürün bulunamadı. Bütçeyi artırmayı veya farklı bir bitiş denemeyi seçebilirsiniz."
        else:
            budget_note = f" (under {effective_budget} TL)" if effective_budget else ""
            reply = f"No products in our catalog match all of your strict criteria{budget_note}. Try raising the budget or broadening the finish."
        return {"reply": reply, "products": []}

    # ==========================================================
    # STAGE 2: SOFT RANKING AMONG VALID CANDIDATES
    # ==========================================================
    scored = []
    for item in candidates:
        name = item["product_name"]
        cat = item["category"]
        price = int(item.get("price", 400))
        meta = PRODUCT_ATTRIBUTES.get(name)
        item_finish = item.get("finish") or (meta["finish"] if meta else "natural")
        item_benefits: Set[str] = set(item.get("benefits") or (meta["benefits"] if meta else set()))

        score = int(item.get("rating", 4.5) * 14)  # ~63-68
        reasons_en: List[str] = []
        reasons_tr: List[str] = []

        if explicit_finishes and item_finish in explicit_finishes:
            score += 22
            fin_tr = {"satin": "saten", "glossy": "parlak", "matte": "mat", "dewy": "nemli"}.get(item_finish, item_finish)
            reasons_en.append(f"{item_finish.capitalize()} finish as requested")
            reasons_tr.append(f"İstediğiniz gibi {fin_tr} bitişli")

        if soft_cats and cat in soft_cats:
            score += 14
            if asks_routine_gap:
                reasons_en.append("Fills a missing step in your routine")
                reasons_tr.append("Rutininizdeki eksik adımı tamamlar")

        overlap = wanted_attrs & item_benefits
        if overlap:
            score += min(24, len(overlap) * 10)
            if asks_shelf_similar and shelf_info["names"]:
                ref = shelf_info["names"][0]
                reasons_en.append(f"Similar effect to your {ref}")
                reasons_tr.append(f"Dolabınızdaki {ref} ile benzer etkili")
            elif not reasons_en:
                if "oil_control" in overlap or "pore_minimizing" in overlap:
                    reasons_en.append("Controls oil and minimizes pores")
                    reasons_tr.append("Yağ ve gözenek kontrolü sağlar")
                elif "hydrating" in overlap or "barrier_repair" in overlap:
                    reasons_en.append("Hydrates and supports skin barrier")
                    reasons_tr.append("Nemlendirir ve cilt bariyerini destekler")

        if prompt_lower:
            doc = f"{name} {item['brand']} {item.get('badge', '')} {item.get('key_pro', '')}"
            sim = _cosine_sim(prompt_lower, doc)
            if sim > 0.12:
                score += int(sim * 20)

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

        if wants_cheap:
            score += max(0, (600 - price) // 30)

        active_budget = prompt_budget or profile_budget
        if active_budget and active_budget > 0:
            if price <= active_budget:
                score += 8
                if not reasons_en:
                    reasons_en.append(f"Within your {active_budget} TL budget")
                    reasons_tr.append(f"{active_budget} TL bütçenize uygun")
            else:
                score -= 18

        clamped = max(60, min(98, score))
        scored.append((
            clamped,
            item,
            reasons_tr[0] if reasons_tr else "Cilt profiliniz için yüksek puanlı seçim",
            reasons_en[0] if reasons_en else "Top-rated match for your profile",
        ))

    scored.sort(key=lambda x: (x[0], x[1]["rating"], x[1]["review_count"]), reverse=True)
    top_items = scored[:3]

    products = [
        {**item, "fit_score": s, "match_reason": r_tr if lang == "tr" else r_en}
        for s, item, r_tr, r_en in top_items
    ]

    best = products[0]["product_name"]
    count = len(products)
    if asks_shelf_similar and shelf_info["names"]:
        ref_list = ", ".join(shelf_info["names"][:2])
        reply = (
            f"Dolabınızdaki {ref_list} ile benzer etkili en uyumlu {count} ürünü seçtim. İlk önerim: {best}."
            if lang == "tr"
            else f"Based on {ref_list} on your shelf, here are the {count} closest matches. Top pick: {best}."
        )
    elif asks_routine_gap:
        reply = (
            f"Dolabınızdaki eksik adımlara göre ilk önerim {best}:"
            if lang == "tr"
            else f"Based on what is missing from your shelf, start with {best}:"
        )
    elif prompt_lower:
        budget_tag_tr = f" ({prompt_budget} TL altı)" if prompt_budget else ""
        budget_tag_en = f" (under {prompt_budget} TL)" if prompt_budget else ""
        reply = (
            f"Kriterlerinize{budget_tag_tr} tam uyan {count} ürün buldum. İlk tercihim: {best}."
            if lang == "tr"
            else f"Found {count} exact matches{budget_tag_en}. My #1 pick: {best}."
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
    valid_products: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    gemini_key = (settings.GEMINI_API_KEY or "").strip()
    openai_key = (settings.OPENAI_API_KEY or "").strip()
    ollama_model = (settings.OLLAMA_MODEL or "").strip()
    if (not gemini_key and not openai_key and not ollama_model) or not valid_products:
        return None

    compact_picks = [
        {
            "product_name": p["product_name"],
            "brand": p["brand"],
            "price": p.get("price", 400),
            "finish": p.get("finish") or PRODUCT_ATTRIBUTES.get(p["product_name"], {}).get("finish", "natural"),
            "fit_score": p.get("fit_score", 88),
        }
        for p in valid_products[:3]
    ]
    if lang == "tr":
        sys_prompt = (
            "Sen MIRA, kısa ve net konuşan bir güzellik danışmanısın. Yalnızca Türkçe yanıt ver, emoji kullanma. "
            f"Kullanıcı cilt profili: {json.dumps(profile_dict, ensure_ascii=False)}. "
            f"Kullanıcı isteği: {prompt!r}. "
            f"Uygun bulunan ürünler (sadece bu adları ve fiyatları kullan): {json.dumps(compact_picks, ensure_ascii=False)}. "
            'Sadece geçerli JSON döndür: {"reply": "En iyi ürünü öneren 1-2 kısa Türkçe cümle", '
            '"reasons": {"ürün adı": "tek kısa Türkçe neden"}}.'
        )
    else:
        sys_prompt = (
            "You are MIRA, a concise beauty advisor. Reply strictly in English. No emojis. "
            f"User skin profile: {json.dumps(profile_dict, ensure_ascii=False)}. "
            f"User request: {prompt!r}. "
            f"Pre-filtered valid products (ONLY reference these exact names and prices): {json.dumps(compact_picks, ensure_ascii=False)}. "
            'Return strict JSON: {"reply": "1-2 short, natural English sentences recommending the top pick", '
            '"reasons": {"exact product_name": "one short personalized reason"}}.'
        )

    timeout = 20.0 if ollama_model and not gemini_key and not openai_key else 12.0
    try:
        raw_text = ""
        async with httpx.AsyncClient(timeout=timeout) as client:
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
            elif ollama_model:
                r = await client.post(
                    f"{settings.OLLAMA_URL.rstrip('/')}/api/chat",
                    json={
                        "model": ollama_model,
                        "stream": False,
                        "format": "json",
                        "options": {"temperature": 0.2, "num_predict": 180},
                        "messages": [{"role": "user", "content": sys_prompt}],
                    },
                )
                if r.status_code == 200:
                    raw_text = r.json().get("message", {}).get("content", "")

        if not raw_text:
            return None

        cleaned = re.sub(r"^```(?:json)?|```$", "", raw_text.strip(), flags=re.MULTILINE).strip()
        parsed = json.loads(cleaned)
        reply = re.sub(r"[^\w\s.,!?%₺TL:;()'\"-çğıöşüÇĞİÖŞÜ]", "", str(parsed.get("reply", ""))).strip()
        if len(reply) < 8:
            return None

        reasons_raw = parsed.get("reasons") if isinstance(parsed.get("reasons"), dict) else {}
        enriched = []
        for p in valid_products[:3]:
            r_text = str(reasons_raw.get(p["product_name"], "")).strip()
            r_clean = re.sub(r"[^\w\s.,!?%₺TL:;()'\"-çğıöşüÇĞİÖŞÜ]", "", r_text).strip()
            enriched.append({**p, "match_reason": r_clean if len(r_clean) >= 6 else p.get("match_reason", "")})
        return {"reply": reply, "products": enriched}
    except Exception:
        return None


async def recommend_top3(
    prompt: Optional[str],
    profile: Any,
    inventory: List[Any],
    lang: str = "en",
    history: Optional[List[Dict[str, str]]] = None,
    catalog_items: Optional[List[Dict[str, Any]]] = None,
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

    base = _deterministic_top3(prompt, profile_dict, inventory, lang, catalog_items=catalog_items)

    if prompt and prompt.strip() and base.get("products"):
        llm_res = await _try_llm_top3(
            prompt.strip(),
            profile_dict,
            shelf_items,
            history or [],
            lang,
            valid_products=base["products"],
        )
        if llm_res:
            return llm_res

    return base
