from typing import List, Dict, Any, Optional

# Curated catalog of top rated products by brand and category with high-res product visual URLs
POPULAR_BRAND_CATALOG: List[Dict[str, Any]] = [
    # Maybelline Lips
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline SuperStay Vinyl Ink Liquid Lipstick",
        "rating": 4.8,
        "review_count": 8420,
        "image_url": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Longwear Shiny Finish",
        "brief_highlight": "Up to 16HR transfer-resistant wear with instant vinyl shine. Non-sticky formula."
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline Lifter Gloss with Hyaluronic Acid",
        "rating": 4.7,
        "review_count": 6150,
        "image_url": "https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Hydrating Plump Finish",
        "brief_highlight": "Infused with Hyaluronic Acid for fuller, intensely hydrated lips without stinging."
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline SuperStay Matte Ink Liquid Lipstick",
        "rating": 4.6,
        "review_count": 12890,
        "image_url": "https://images.unsplash.com/photo-1599732434440-62136015b6b8?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Ultra-Matte Longwear",
        "brief_highlight": "Flawless saturated matte finish that lasts through food and drinks for up to 16 hours."
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline Color Sensational Creamy Matte Lipstick",
        "rating": 4.4,
        "review_count": 4310,
        "image_url": "https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Comfortable Matte Bullet",
        "brief_highlight": "Enriched with nourishing sesame oil and pure pigments for comfortable daily wear."
    },

    # Maybelline Mascaras
    {
        "brand": "maybelline",
        "category": "mascara",
        "product_name": "Maybelline Lash Sensational Sky High Mascara",
        "rating": 4.8,
        "review_count": 15400,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Flex Tower Brush",
        "brief_highlight": "Bamboo extract formula delivering limitless length and lightweight volume."
    },
    {
        "brand": "maybelline",
        "category": "mascara",
        "product_name": "Maybelline Lash Sensational Full Fan Effect Mascara",
        "rating": 4.6,
        "review_count": 9800,
        "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Curved Fan Brush",
        "brief_highlight": "10 layers of bristles capturing every lash for a wide-open multiplied fan effect."
    },

    # Maybelline Foundations
    {
        "brand": "maybelline",
        "category": "foundation",
        "product_name": "Maybelline Fit Me Matte + Poreless Foundation",
        "rating": 4.6,
        "review_count": 14200,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Matte Oil-Control",
        "brief_highlight": "Micro-powders absorb shine and blur visible pores for normal to oily skin."
    },
    {
        "brand": "maybelline",
        "category": "foundation",
        "product_name": "Maybelline SuperStay 30H Lumi-Matte Foundation",
        "rating": 4.5,
        "review_count": 5100,
        "image_url": "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Air-Light Lumi-Matte",
        "brief_highlight": "Sweat-resistant, breathable high coverage with a subtle skin-like satin luminescence."
    },

    # L'Oreal Products
    {
        "brand": "loreal",
        "category": "foundation",
        "product_name": "L'Oreal Infallible 24H Fresh Wear Foundation",
        "rating": 4.7,
        "review_count": 11200,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Breathable Satin",
        "brief_highlight": "Ultra-thin breathable liquid formula with sweat and transfer resistance."
    },
    {
        "brand": "loreal",
        "category": "mascara",
        "product_name": "L'Oreal Telescopic Original Lengthening Mascara",
        "rating": 4.8,
        "review_count": 13900,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Precision Comb",
        "brief_highlight": "Iconic precision flat comb brush that separates and lengthens lashes by up to 60%."
    },

    # MAC Products
    {
        "brand": "mac",
        "category": "lip",
        "product_name": "MAC Retro Matte Lipstick (Ruby Woo / Velvet Teddy)",
        "rating": 4.8,
        "review_count": 16500,
        "image_url": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Iconic Ultra-Matte",
        "brief_highlight": "Zero-shine intense matte bullet with world-renowned pigment saturation."
    },
    {
        "brand": "mac",
        "category": "foundation",
        "product_name": "MAC Studio Fix Fluid SPF 15 24HR Matte Foundation",
        "rating": 4.6,
        "review_count": 14100,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Oil-Control Matte",
        "brief_highlight": "Medium-to-full buildable coverage with all-day oil and shine control."
    },

    # La Roche-Posay (Skincare & Sunscreen)
    {
        "brand": "la roche",
        "category": "sunscreen",
        "product_name": "La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+",
        "rating": 4.9,
        "review_count": 18200,
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Ultra-Long UVA Protection",
        "brief_highlight": "Mexoryl 400 filter protecting against deep cellular UV damage. Non-greasy, non-stinging."
    },
    {
        "brand": "la roche",
        "category": "moisturizer",
        "product_name": "La Roche-Posay Cicaplast Baume B5+ Soothing Cream",
        "rating": 4.9,
        "review_count": 21000,
        "image_url": "https://images.unsplash.com/photo-1608248597359-009117865239?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "Multi-Purpose Barrier Repair",
        "brief_highlight": "Madecassoside + 5% Panthenol + Tribioma to restore and soothe irritated/rosacea barriers."
    },

    # CeraVe Products
    {
        "brand": "cerave",
        "category": "moisturizer",
        "product_name": "CeraVe Moisturizing Cream with 3 Essential Ceramides",
        "rating": 4.8,
        "review_count": 25000,
        "image_url": "https://images.unsplash.com/photo-1608248597359-009117865239?auto=format&fit=crop&w=400&q=80",
        "finish_or_tag": "MVE Technology Hydration",
        "brief_highlight": "24-hour continuous hydration with skin-identical ceramides and hyaluronic acid."
    }
]


def detect_general_category_query(query: str) -> Optional[Dict[str, Any]]:
    """
    Detects if the user typed a broad brand + category inquiry (e.g. 'maybelline ruj', 'loreal fondoten')
    without specifying a concrete product line.
    Returns matched brand, category, and ranked list of popular products.
    """
    lower = query.lower().strip()

    # Identify brand
    matched_brand = None
    if any(b in lower for b in ["maybelline", "meybilin"]):
        matched_brand = "maybelline"
    elif any(b in lower for b in ["loreal", "l'oreal", "loriel"]):
        matched_brand = "loreal"
    elif any(b in lower for b in ["mac", "m.a.c"]):
        matched_brand = "mac"
    elif any(b in lower for b in ["la roche", "laroche", "posay"]):
        matched_brand = "la roche"
    elif any(b in lower for b in ["cerave", "sera ve"]):
        matched_brand = "cerave"
    elif any(b in lower for b in ["nars"]):
        matched_brand = "nars"

    # Identify category
    matched_category = None
    if any(c in lower for c in ["ruj", "lipstick", "lip", "gloss", "parlatici"]):
        matched_category = "lip"
    elif any(c in lower for c in ["fondoten", "fondöten", "foundation"]):
        matched_category = "foundation"
    elif any(c in lower for c in ["maskara", "mascara", "rimel"]):
        matched_category = "mascara"
    elif any(c in lower for c in ["gunes", "güneş", "sunscreen", "spf"]):
        matched_category = "sunscreen"
    elif any(c in lower for c in ["krem", "nemlendirici", "moisturizer"]):
        matched_category = "moisturizer"
    elif any(c in lower for c in ["serum"]):
        matched_category = "serum"

    # If both brand and category are detected, check if a specific product line was mentioned
    specific_lines = [
        "vinyl", "matte ink", "superstay", "fit me", "lifter", "sky high",
        "infallible", "telescopic", "ruby woo", "velvet teddy", "studio fix",
        "anthelios", "cicaplast", "uvmune", "baume"
    ]
    is_specific = any(line in lower for line in specific_lines)

    # If it's a broad query (e.g. 'maybelline ruj')
    if matched_brand and matched_category and not is_specific:
        # Filter and rank products by rating descending
        matched_items = [
            p for p in POPULAR_BRAND_CATALOG
            if p["brand"] == matched_brand and p["category"] == matched_category
        ]
        matched_items.sort(key=lambda x: (x["rating"], x["review_count"]), reverse=True)

        if matched_items:
            brand_title = "Maybelline New York" if matched_brand == "maybelline" else matched_brand.upper()
            cat_title = "Ruj ve Dudak Ürünleri" if matched_category == "lip" else (
                "Fondötenler" if matched_category == "foundation" else (
                    "Maskaralar" if matched_category == "mascara" else (
                        "Güneş Kremleri" if matched_category == "sunscreen" else "Cilt Bakım Ürünleri"
                    )
                )
            )
            return {
                "brand": matched_brand,
                "category": matched_category,
                "disambiguation_message": f"En popüler ve en yüksek puanlı {brand_title} {cat_title} sıralandı. Hangi ürünü incelemek istersiniz?",
                "suggested_products": matched_items
            }

    return None
