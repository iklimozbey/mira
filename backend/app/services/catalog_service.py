from typing import List, Dict, Any, Optional

# Curated catalog of top rated products with reliable emoji/visual indicators and clear Pros/Cons
POPULAR_BRAND_CATALOG: List[Dict[str, Any]] = [
    # --- FLORMAR PRODUCTS ---
    {
        "brand": "flormar",
        "category": "lip",
        "product_name": "Flormar Kiss Me More Lip Tattoo",
        "rating": 4.7,
        "review_count": 9200,
        "image_url": "/static/images/products/flormar_kiss_me_more.jpg",
        "badge": "Kalıcı Likit Mat",
        "shade_hex": "#D17D87",
        "shade_name": "05 Blush • Pudra Gül",
        "key_pro": "Sıfır bulaşma, yemek ve içeceğe 8 saat tam direnç",
        "key_con": "Kuru dudaklarda çizgi yapabilir, altına balm şart"
    },
    {
        "brand": "flormar",
        "category": "mascara",
        "product_name": "Flormar Precious Curl Mascara",
        "rating": 4.6,
        "review_count": 8100,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "badge": "Kıvırıcı Kavisli Fırça",
        "key_pro": "Düz kirpikleri kıvırarak gün boyu dik tutar",
        "key_con": "2 kattan sonra hafif topaklanma yapabilir"
    },
    {
        "brand": "flormar",
        "category": "foundation",
        "product_name": "Flormar Perfect Coverage Foundation",
        "rating": 4.5,
        "review_count": 6700,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
        "badge": "12 Saat Tam Kapatıcı",
        "key_pro": "Tüm lekeleri ve kızarıklıkları tek katta tamamen örter",
        "key_con": "Yoğun yapılıdır, kuru ciltlerde maske gibi durabilir"
    },
    {
        "brand": "flormar",
        "category": "mascara",
        "product_name": "Flormar Hero Volume & Curl Mascara",
        "rating": 4.7,
        "review_count": 5400,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "badge": "Ekstra Hacim & Yoğunluk",
        "key_pro": "Kum saati fırçasıyla kirpikleri tek tek ayırıp dolgunlaştırır",
        "key_con": "Çift aşamalı yağ bazlı temizleyici ile çıkarılmalıdır"
    },
    {
        "brand": "flormar",
        "category": "lip",
        "product_name": "Flormar Water Lip Stain",
        "rating": 4.4,
        "review_count": 4100,
        "image_url": "/static/images/products/flormar_kiss_me_more.jpg",
        "badge": "Su Bazlı Dudak Tinti",
        "shade_hex": "#C84B5B",
        "shade_name": "02 Natural Rose",
        "key_pro": "Ağırlık yapmayan tüy gibi doğal renk ve kalıcılık",
        "key_con": "Hızlı sabitlenir, sürerken anında dağıtılmalıdır"
    },

    # --- MAYBELLINE PRODUCTS ---
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline SuperStay Vinyl Ink",
        "rating": 4.8,
        "review_count": 8420,
        "image_url": "/static/images/products/maybelline_vinyl_ink.jpg",
        "badge": "16 Saat Kalıcı Parlak",
        "shade_hex": "#BD7071",
        "shade_name": "35 Cheeky • Pudra Gül",
        "key_pro": "Bulaşmayan, 16 saat kalıcı parlak vinyl bitiş",
        "key_con": "Çıkarmak için çift aşamalı yağ bazlı temizleyici şart"
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline Lifter Gloss",
        "rating": 4.7,
        "review_count": 6150,
        "image_url": "/static/images/products/maybelline_vinyl_ink.jpg",
        "badge": "Hyaluronik Asitli Parlatıcı",
        "shade_hex": "#E6A5AF",
        "shade_name": "002 Ice • Işıltılı Pudra",
        "key_pro": "Dudakları yakmadan anında dolgunlaştırır ve nemlendirir",
        "key_con": "Yapışkan hissi az ama yemek sonrası tazeleme ister"
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline SuperStay Matte Ink",
        "rating": 4.6,
        "review_count": 12890,
        "image_url": "/static/images/products/maybelline_matte_ink.jpg",
        "badge": "Ultra Mat Likit",
        "shade_hex": "#BF5C64",
        "shade_name": "15 Lover • Gül Kurusu",
        "key_pro": "Yemeğe, içeceğe ve maskeye tam dayanıklı sıfır transfer",
        "key_con": "Dudağı kurutabilir, öncesinde nemlendirici balm şart"
    },
    {
        "brand": "maybelline",
        "category": "mascara",
        "product_name": "Maybelline Sky High Mascara",
        "rating": 4.8,
        "review_count": 15400,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "badge": "Sonsuz Uzunluk",
        "key_pro": "Esnek fırçasıyla en kısa kirpikleri bile tel tel uzatır",
        "key_con": "İki kattan fazla sürülürse hafif topaklanma yapabilir"
    },
    {
        "brand": "maybelline",
        "category": "mascara",
        "product_name": "Maybelline Lash Sensational Fan",
        "rating": 4.6,
        "review_count": 9800,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "badge": "Yelpaze Hacim",
        "key_pro": "Kıvrık fırçasıyla kirpikleri dipten kaldırır ve hacim verir",
        "key_con": "Göz kapağı çok yağlıysa gün sonuna doğru hafif akma yapabilir"
    },
    {
        "brand": "maybelline",
        "category": "foundation",
        "product_name": "Maybelline Fit Me Matte + Poreless",
        "rating": 4.6,
        "review_count": 14200,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
        "badge": "Gözenek Gizleyici Mat",
        "key_pro": "T bölgesindeki parlamayı alır ve gözenekleri pürüzsüzleştirir",
        "key_con": "Kuru bölgelere tutunur, yarım ton oksitlenme yapabilir"
    },

    # --- L'OREAL PRODUCTS ---
    {
        "brand": "loreal",
        "category": "foundation",
        "product_name": "L'Oreal Infallible 24H Fresh Wear",
        "rating": 4.7,
        "review_count": 11200,
        "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
        "badge": "Nefes Alan Saten",
        "key_pro": "Terlemeye dayanıklı, cildi boğmayan doğal saten bitiş",
        "key_con": "Oksitlenmemesi için bir ton açık renk seçilmeli"
    },
    {
        "brand": "loreal",
        "category": "mascara",
        "product_name": "L'Oreal Telescopic Mascara",
        "rating": 4.8,
        "review_count": 13900,
        "image_url": "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?auto=format&fit=crop&w=400&q=80",
        "badge": "Taraklı Ekstra Uzunluk",
        "key_pro": "Düz tarak uçlu fırçasıyla kirpikleri yapıştırmadan uzatır",
        "key_con": "Hacimden ziyade sadece uzunluk odaklı bir üründür"
    },

    # --- LA ROCHE-POSAY & CERAVE ---
    {
        "brand": "la roche",
        "category": "sunscreen",
        "product_name": "La Roche-Posay Anthelios UVMune 400",
        "rating": 4.9,
        "review_count": 18200,
        "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80",
        "badge": "Görünmez Akışkan SPF 50+",
        "key_pro": "Beyazlık bırakmaz, göz yakmaz, makyaj altında soyulmaz",
        "key_con": "Çok yağlı ciltlerde gün ortasında hafif parlama yapabilir"
    },
    {
        "brand": "la roche",
        "category": "moisturizer",
        "product_name": "La Roche-Posay Cicaplast Baume B5+",
        "rating": 4.9,
        "review_count": 21000,
        "image_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80",
        "badge": "Yoğun Bariyer Onarıcı",
        "key_pro": "Rozasea kızarıklığını ve tahriş olmuş bariyeri anında yatıştırır",
        "key_con": "Ağır yapılıdır, akneli yağlı ciltler sadece ince tabaka sürmeli"
    },
    {
        "brand": "cerave",
        "category": "moisturizer",
        "product_name": "CeraVe Nemlendirici Krem",
        "rating": 4.8,
        "review_count": 24000,
        "image_url": "/static/images/products/cerave_cream.jpg",
        "badge": "3 Temel Seramid",
        "key_pro": "Kuru ve tahriş olmuş bariyeri 24 saat derinlemesine nemlendirir",
        "key_con": "Çok yağlı ciltlerde gün içinde ağır hissedilebilir"
    },

    # --- THE ORDINARY ---
    {
        "brand": "the ordinary",
        "category": "serum",
        "product_name": "The Ordinary Niacinamide 10% + Zinc 1%",
        "rating": 4.6,
        "review_count": 28000,
        "image_url": "/static/images/products/the_ordinary_serum.jpg",
        "badge": "Sebum & Gözenek Kontrolü",
        "key_pro": "T bölgesindeki fazla yağı keser ve gözenek görünümünü sıkılaştırır",
        "key_con": "Çok sürülürse beyaz köpürme veya pütürlenme yapabilir"
    },
    {
        "brand": "the ordinary",
        "category": "serum",
        "product_name": "The Ordinary Hyaluronic Acid 2% + B5",
        "rating": 4.7,
        "review_count": 19500,
        "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
        "badge": "Çoklu Moleküler Nem",
        "key_pro": "Cildi neme doyurur ve anında dolgun, canlı görünüm sağlar",
        "key_con": "Kuru havada nemli cilde uygulanmazsa gerginlik hissi verebilir"
    },

    # --- KIKO & GOLDEN ROSE ---
    {
        "brand": "kiko",
        "category": "lip",
        "product_name": "Kiko 3D Hydra Lipgloss",
        "rating": 4.8,
        "review_count": 11500,
        "image_url": "/static/images/products/maybelline_matte_ink.jpg",
        "badge": "3D Cam Parlaklık",
        "shade_hex": "#C26774",
        "shade_name": "17 Pearly Mauve • Mürdüm Gül",
        "key_pro": "Yapışkanlık yapmayan pürüzsüz cam ayna ışıltısı",
        "key_con": "Yemek sonrası tazeleme gerektirir"
    },
    {
        "brand": "golden rose",
        "category": "lip",
        "product_name": "Golden Rose Velvet Matte Lipstick",
        "rating": 4.5,
        "review_count": 8900,
        "image_url": "/static/images/products/mac_ruby_woo.jpg",
        "badge": "Kadife Matlık",
        "shade_hex": "#A44A59",
        "shade_name": "16 Rose Wood • Sıcak Gül",
        "key_pro": "Tek sürüşte yüksek pigment ve yumuşak kadifemsi his",
        "key_con": "Kalıcılığı likit mat rujlar kadar yüksek değildir"
    }
]


def detect_general_category_query(query: str) -> Optional[Dict[str, Any]]:
    lower = query.lower().strip()

    # Detect Brands
    matched_brand = None
    if any(b in lower for b in ["flormar", "flormare"]):
        matched_brand = "flormar"
    elif any(b in lower for b in ["maybelline", "meybilin", "maybeline"]):
        matched_brand = "maybelline"
    elif any(b in lower for b in ["loreal", "l'oreal", "loriel"]):
        matched_brand = "loreal"
    elif any(b in lower for b in ["cerave", "sera ve"]):
        matched_brand = "cerave"
    elif any(b in lower for b in ["la roche", "laroche", "posay"]):
        matched_brand = "la roche"
    elif any(b in lower for b in ["the ordinary", "ordinary"]):
        matched_brand = "the ordinary"
    elif any(b in lower for b in ["kiko"]):
        matched_brand = "kiko"
    elif any(b in lower for b in ["golden rose", "goldenrose"]):
        matched_brand = "golden rose"

    # Detect Categories
    matched_category = None
    if any(c in lower for c in ["ruj", "lipstick", "lip", "gloss", "parlatici", "tint", "balm"]):
        matched_category = "lip"
    elif any(c in lower for c in ["fondoten", "fondöten", "foundation", "bb"]):
        matched_category = "foundation"
    elif any(c in lower for c in ["maskara", "mascara", "rimel", "lash"]):
        matched_category = "mascara"
    elif any(c in lower for c in ["gunes", "güneş", "sunscreen", "spf"]):
        matched_category = "sunscreen"
    elif any(c in lower for c in ["krem", "nemlendirici", "moisturizer"]):
        matched_category = "moisturizer"
    elif any(c in lower for c in ["serum", "asit", "acid"]):
        matched_category = "serum"

    # Specific product lines that mean user wants a specific product report, NOT suggestions
    specific_lines = [
        "vinyl", "matte ink", "superstay", "fit me", "lifter", "sky high",
        "kiss me more", "precious curl", "perfect coverage", "hero volume",
        "infallible", "telescopic", "anthelios", "cicaplast", "uvmune",
        "niacinamide", "hyaluronic", "3d hydra", "velvet matte"
    ]
    is_specific = any(line in lower for line in specific_lines)

    # If it is a specific product, do NOT intercept as general query
    if is_specific:
        return None

    words = lower.split()

    # CASE 1: Brand + Category (e.g. "maybelline ruj", "flormar maskara")
    if matched_brand and matched_category and len(words) <= 3:
        matched_items = [
            p for p in POPULAR_BRAND_CATALOG
            if p["brand"] == matched_brand and p["category"] == matched_category
        ]
        if matched_items:
            brand_title = matched_brand.title()
            cat_map = {"lip": "Rujları", "foundation": "Fondötenleri", "mascara": "Maskaraları", "sunscreen": "Güneş Kremleri", "moisturizer": "Nemlendiricileri", "serum": "Serumları"}
            return {
                "brand": matched_brand,
                "category": matched_category,
                "disambiguation_message": f"En Çok Tercih Edilen {brand_title} {cat_map.get(matched_category, 'Ürünleri')}",
                "suggested_products": sorted(matched_items, key=lambda x: (x["rating"], x["review_count"]), reverse=True)
            }

    # CASE 2: Brand Alone (e.g. "flormar", "maybelline", "cerave", "the ordinary")
    if matched_brand and len(words) <= 2:
        matched_items = [
            p for p in POPULAR_BRAND_CATALOG
            if p["brand"] == matched_brand
        ]
        if matched_items:
            brand_title = matched_brand.title()
            return {
                "brand": matched_brand,
                "category": None,
                "disambiguation_message": f"En Popüler {brand_title} Ürünleri",
                "suggested_products": sorted(matched_items, key=lambda x: (x["rating"], x["review_count"]), reverse=True)
            }

    # CASE 3: Category Alone (e.g. "ruj", "fondöten", "güneş kremi", "maskara")
    if matched_category and not matched_brand and len(words) <= 2:
        matched_items = [
            p for p in POPULAR_BRAND_CATALOG
            if p["category"] == matched_category
        ]
        if matched_items:
            cat_map = {"lip": "Rujlar", "foundation": "Fondötenler", "mascara": "Maskaralar", "sunscreen": "Güneş Kremleri", "moisturizer": "Nemlendiriciler", "serum": "Serumlar"}
            return {
                "brand": None,
                "category": matched_category,
                "disambiguation_message": f"En Çok Puan Alan {cat_map.get(matched_category, 'Ürünler')}",
                "suggested_products": sorted(matched_items, key=lambda x: (x["rating"], x["review_count"]), reverse=True)[:6]
            }

    return None
