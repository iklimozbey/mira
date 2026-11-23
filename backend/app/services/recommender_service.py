"""AI & deterministic Top-3 product recommender for Home Dashboard and Chatbot."""
import json
import re
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.services.catalog_service import POPULAR_BRAND_CATALOG

_CATEGORY_KEYWORDS = {
    "lip": ["ruj", "lip", "lipstick", "gloss", "tint", "dudak", "mat ruj", "parlatici", "parlatıcı", "balm"],
    "foundation": ["fondöten", "fondoten", "foundation", "kapatıcı", "kapatici", "ten", "bb", "cc", "matte"],
    "mascara": ["maskara", "mascara", "rimel", "kirpik", "lash"],
    "sunscreen": ["güneş", "gunes", "sunscreen", "spf", "uv", "koruyucu", "güneş kremi"],
    "moisturizer": ["nemlendirici", "krem", "moisturizer", "cream", "bariyer", "barrier", "kuruluk", "dry"],
    "serum": ["serum", "niacinamide", "hyaluronic", "leke", "gözenek", "gozenek", "akne", "acne", "sivilce", "asit"],
}

_SKIN_CONCERN_BOOST = {
    "acne": {"The Ordinary Niacinamide 10% + Zinc 1%", "La Roche-Posay Anthelios UVMune 400", "Maybelline Fit Me Matte + Poreless"},
    "pores": {"The Ordinary Niacinamide 10% + Zinc 1%", "Maybelline Fit Me Matte + Poreless"},
    "rosacea": {"La Roche-Posay Cicaplast Baume B5+", "CeraVe Moisturizing Cream", "La Roche-Posay Anthelios UVMune 400"},
    "redness": {"La Roche-Posay Cicaplast Baume B5+", "CeraVe Moisturizing Cream"},
    "dry": {"The Ordinary Hyaluronic Acid 2% + B5", "CeraVe Moisturizing Cream", "La Roche-Posay Cicaplast Baume B5+", "Maybelline Lifter Gloss"},
    "oily": {"The Ordinary Niacinamide 10% + Zinc 1%", "Maybelline Fit Me Matte + Poreless", "La Roche-Posay Anthelios UVMune 400"},
    "combination": {"The Ordinary Niacinamide 10% + Zinc 1%", "L'Oreal Infallible 24H Fresh Wear", "CeraVe Moisturizing Cream"},
    "sensitive": {"La Roche-Posay Cicaplast Baume B5+", "CeraVe Moisturizing Cream", "La Roche-Posay Anthelios UVMune 400"},
}


def _extract_budget_from_prompt(prompt: str) -> Optional[int]:
    m = re.search(r"(\d{2,5})\s*(?:tl|try|lira|₺|\$|altı|alti|under|max|bütçe|butce)?", prompt.lower())
    if m:
        val = int(m.group(1))
        if 50 <= val <= 20000:
            return val
    return None


def _score_product(
    item: Dict[str, Any],
    prompt_lower: str,
    matched_categories: List[str],
    skin_type: str,
    concerns: List[str],
    budget_max: Optional[int],
    owned_names: set,
) -> Dict[str, Any]:
    score = int(item.get("rating", 4.5) * 14)
    reasons_en: List[str] = []
    reasons_tr: List[str] = []
    name = item["product_name"]
    cat = item["category"]
    price = int(item.get("price", 400))

    if matched_categories:
        if cat in matched_categories:
            score += 22
            reasons_en.append("Matches your requested category")
            reasons_tr.append("İstediğiniz kategoriyle eşleşiyor")
        else:
            score -= 18

    tokens = [t for t in re.split(r"\s+", prompt_lower) if len(t) >= 3]
    haystack = f"{name} {item['brand']} {item.get('badge', '')} {item.get('key_pro', '')}".lower()
    hits = sum(1 for t in tokens if t in haystack)
    if hits:
        score += min(18, hits * 6)

    if skin_type and name in _SKIN_CONCERN_BOOST.get(skin_type, set()):
        score += 10
        reasons_en.append(f"Suited for {skin_type} skin")
        reasons_tr.append("Cilt tipinize uygun")

    for c in concerns:
        if name in _SKIN_CONCERN_BOOST.get(c, set()):
            score += 8
            if "Targets your skin concerns" not in reasons_en:
                reasons_en.append("Targets your skin concerns")
                reasons_tr.append("Cilt endişelerinizi hedefler")

    if budget_max and budget_max > 0:
        if price <= budget_max:
            score += 7
            reasons_en.append(f"Within your {budget_max} TL budget")
            reasons_tr.append(f"{budget_max} TL bütçenize uygun")
        else:
            score -= 22

    if name.lower() in owned_names:
        score -= 25

    clamped = max(55, min(98, score))
    return {
        "score": clamped,
        "reason_en": reasons_en[0] if reasons_en else "Top-rated pick for your profile",
        "reason_tr": reasons_tr[0] if reasons_tr else "Profiliniz için yüksek puanlı öneri",
    }


def _deterministic_top3(
    prompt: Optional[str],
    profile_dict: Dict[str, Any],
    owned_names: set,
    lang: str,
) -> Dict[str, Any]:
    prompt_lower = (prompt or "").lower().strip()
    matched_categories = [
        cat for cat, kws in _CATEGORY_KEYWORDS.items() if any(kw in prompt_lower for kw in kws)
    ]
    prompt_budget = _extract_budget_from_prompt(prompt_lower) if prompt_lower else None
    budget_max = prompt_budget or profile_dict.get("budget_max")
    skin_type = (profile_dict.get("skin_type") or "").lower()
    concerns = [c.lower() for c in (profile_dict.get("skin_concerns") or [])]

    scored = []
    for item in POPULAR_BRAND_CATALOG:
        res = _score_product(
            item=item,
            prompt_lower=prompt_lower,
            matched_categories=matched_categories,
            skin_type=skin_type,
            concerns=concerns,
            budget_max=budget_max,
            owned_names=owned_names,
        )
        scored.append((res["score"], item, res))

    scored.sort(key=lambda x: (x[0], x[1]["rating"], x[1]["review_count"]), reverse=True)
    top3 = scored[:3]

    products = []
    for s, item, res in top3:
        products.append({
            **item,
            "fit_score": s,
            "match_reason": res["reason_tr"] if lang == "tr" else res["reason_en"],
        })

    if prompt_lower:
        reply = (
            "İhtiyacınıza, cilt profilinize ve bütçenize en uygun 3 ürünü seçtim:"
            if lang == "tr"
            else "Here are the 3 best-matching products for your request, skin profile, and budget:"
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
    owned_names: set,
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
        }
        for p in POPULAR_BRAND_CATALOG
    ]
    sys_prompt = (
        f"You are MIRA, a concise beauty advisor. Language: {'Turkish' if lang == 'tr' else 'English'}. "
        f"User profile: {json.dumps(profile_dict)}. Already owned: {list(owned_names)}. "
        f"User request: {prompt!r}. "
        f"Pick EXACTLY 3 best-matching products from this catalog: {json.dumps(compact_catalog)}. "
        'Return strict JSON: {"reply": "1 short sentence", "picks": [{"product_name": "exact name", "fit_score": 92, "match_reason": "short reason"}]}. No emoji.'
    )

    try:
        raw_text = ""
        async with httpx.AsyncClient(timeout=10.0) as client:
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
) -> Dict[str, Any]:
    profile_dict = {
        "skin_type": getattr(profile, "skin_type", None) if profile else None,
        "skin_undertone": getattr(profile, "skin_undertone", None) if profile else None,
        "skin_concerns": getattr(profile, "skin_concerns", []) if profile else [],
        "allergies_sensitivities": getattr(profile, "allergies_sensitivities", []) if profile else [],
        "budget_max": getattr(profile, "budget_max", None) if profile else None,
    }
    owned_names = {
        (getattr(item, "product_name", "") or "").lower()
        for item in inventory
        if getattr(item, "status", "owned") == "owned"
    }

    if prompt and prompt.strip():
        llm_res = await _try_llm_top3(prompt.strip(), profile_dict, owned_names, lang)
        if llm_res:
            return llm_res

    return _deterministic_top3(prompt, profile_dict, owned_names, lang)
