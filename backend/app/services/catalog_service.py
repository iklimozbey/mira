from typing import List, Dict, Any, Optional

# Curated catalog of top rated products with reliable emoji/visual indicators and clear Pros/Cons
POPULAR_BRAND_CATALOG: List[Dict[str, Any]] = [
    # Maybelline Lips
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline SuperStay Vinyl Ink",
        "rating": 4.8,
        "review_count": 8420,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163195.png",
        "badge": "16 Saat Kalıcı Parlak",
        "key_pro": "Bulaşmayan, 16 saat kalıcı parlak vinyl bitiş",
        "key_con": "Çıkarmak için çift aşamalı yağ bazlı temizleyici şart"
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline Lifter Gloss",
        "rating": 4.7,
        "review_count": 6150,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163195.png",
        "badge": "Hyaluronik Asitli Parlatıcı",
        "key_pro": "Dudakları yakmadan anında dolgunlaştırır ve nemlendirir",
        "key_con": "Yapışkan hissi az ama yemek sonrası tazeleme ister"
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline SuperStay Matte Ink",
        "rating": 4.6,
        "review_count": 12890,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163195.png",
        "badge": "Ultra Mat Likit",
        "key_pro": "Yemeğe, içeceğe ve maskeye tam dayanıklı sıfır transfer",
        "key_con": "Dudağı kurutabilir, öncesinde nemlendirici balm şart"
    },
    {
        "brand": "maybelline",
        "category": "lip",
        "product_name": "Maybelline Color Sensational Matte",
        "rating": 4.4,
        "review_count": 4310,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163195.png",
        "badge": "Konforlu Klasik Ruj",
        "key_pro": "Dudak çizgilerine dolmayan yumuşak saten-mat doku",
        "key_con": "Likit rujlar kadar uzun süre kalıcı değil"
    },

    # Maybelline Mascaras
    {
        "brand": "maybelline",
        "category": "mascara",
        "product_name": "Maybelline Sky High Mascara",
        "rating": 4.8,
        "review_count": 15400,
        "image_url": "https://cdn-icons-png.flaticon.com/512/2553/2553691.png",
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
        "image_url": "https://cdn-icons-png.flaticon.com/512/2553/2553691.png",
        "badge": "Yelpaze Hacim",
        "key_pro": "Kıvrık fırçasıyla kirpikleri dipten kaldırır ve hacim verir",
        "key_con": "Göz kapağı çok yağlıysa gün sonuna doğru hafif akma yapabilir"
    },

    # Maybelline Foundations
    {
        "brand": "maybelline",
        "category": "foundation",
        "product_name": "Maybelline Fit Me Matte + Poreless",
        "rating": 4.6,
        "review_count": 14200,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163200.png",
        "badge": "Gözenek Gizleyici Mat",
        "key_pro": "T bölgesindeki parlamayı alır ve gözenekleri pürüzsüzleştirir",
        "key_con": "Kuru bölgelere tutunur, yarım ton oksitlenme yapabilir"
    },
    {
        "brand": "maybelline",
        "category": "foundation",
        "product_name": "Maybelline SuperStay Lumi-Matte",
        "rating": 4.5,
        "review_count": 5100,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163200.png",
        "badge": "Hafif Işıltılı Mat",
        "key_pro": "Maske hissi vermeyen nefes alan hafif yüksek kapatıcılık",
        "key_con": "Kuru ciltlerde gün içinde pudralı görünebilir"
    },

    # L'Oreal Products
    {
        "brand": "loreal",
        "category": "foundation",
        "product_name": "L'Oreal Infallible 24H Fresh Wear",
        "rating": 4.7,
        "review_count": 11200,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163200.png",
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
        "image_url": "https://cdn-icons-png.flaticon.com/512/2553/2553691.png",
        "badge": "Taraklı Ekstra Uzunluk",
        "key_pro": "Düz tarak uçlu fırçasıyla kirpikleri yapıştırmadan uzatır",
        "key_con": "Hacimden ziyade sadece uzunluk odaklı bir üründür"
    },

    # MAC Products
    {
        "brand": "mac",
        "category": "lip",
        "product_name": "MAC Retro Matte (Velvet Teddy)",
        "rating": 4.8,
        "review_count": 16500,
        "image_url": "https://cdn-icons-png.flaticon.com/512/3163/3163195.png",
        "badge": "Kült Mat Ruj",
        "key_pro": "Tek sürüşte yoğun renk veren dünyaca ünlü ikonik matlık",
        "key_con": "Dudakta kuruluk hissi bırakabilir, pürüzsüz dudak ister"
    },

    # La Roche-Posay
    {
        "brand": "la roche",
        "category": "sunscreen",
        "product_name": "La Roche-Posay Anthelios UVMune 400",
        "rating": 4.9,
        "review_count": 18200,
        "image_url": "https://cdn-icons-png.flaticon.com/512/2965/2965567.png",
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
        "image_url": "https://cdn-icons-png.flaticon.com/512/2965/2965567.png",
        "badge": "Yoğun Bariyer Onarıcı",
        "key_pro": "Rozasea kızarıklığını ve tahriş olmuş bariyeri anında yatıştırır",
        "key_con": "Ağır yapılıdır, akneli yağlı ciltler sadece ince tabaka sürmeli"
    }
]


def detect_general_category_query(query: str) -> Optional[Dict[str, Any]]:
    lower = query.lower().strip()

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

    specific_lines = [
        "vinyl", "matte ink", "superstay", "fit me", "lifter", "sky high",
        "infallible", "telescopic", "ruby woo", "velvet teddy", "studio fix",
        "anthelios", "cicaplast", "uvmune", "baume"
    ]
    is_specific = any(line in lower for line in specific_lines)

    if matched_brand and matched_category and not is_specific:
        matched_items = [
            p for p in POPULAR_BRAND_CATALOG
            if p["brand"] == matched_brand and p["category"] == matched_category
        ]
        matched_items.sort(key=lambda x: (x["rating"], x["review_count"]), reverse=True)

        if matched_items:
            brand_title = "Maybelline" if matched_brand == "maybelline" else matched_brand.upper()
            cat_title = "Rujları" if matched_category == "lip" else (
                "Fondötenleri" if matched_category == "foundation" else (
                    "Maskaraları" if matched_category == "mascara" else "Güneş Kremleri"
                )
            )
            return {
                "brand": matched_brand,
                "category": matched_category,
                "disambiguation_message": f"En Çok Tercih Edilen {brand_title} {cat_title}",
                "suggested_products": matched_items
            }

    return None
