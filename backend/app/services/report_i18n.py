"""Localization + cleanup for research reports.

The analysis engine produces a mix of Turkish and English sentences and some
developer-style markers (emoji, "GUARDRAIL VETO"). This module makes every
user-facing string clean and consistent for the requested language.
"""
import re
from typing import Any, Dict, List

_EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]")
_GUARD = re.compile(r"^\s*GUARDRAIL (?:VETO|ALERT) \(([^)]+)\):\s*")
_CAPS_LABEL = re.compile(r"^([A-Z][A-Z\- /]{3,}):\s+")

# Static Turkish -> English sentences.
TR_TO_EN: Dict[str, str] = {
    "Cildinizle uyumlu. Satın almadan önce dolabınızdaki mevcut ürünleri tüketmeniz önerilir.": "Compatible with your skin. Finish the products on your shelf before buying.",
    "Kolay sürülen homojen ve hafif doku": "Light, even texture that is easy to apply",
    "Günlük rutinlerle rahat uyum sağlayan yapı": "Fits comfortably into daily routines",
    "Kullanıcılar tarafından güvenilen dengeli formül": "Balanced formula trusted by users",
    "Kalıcılığı cilt hazırlığına göre değişiklik gösterebilir": "Wear time may vary depending on skin prep",
    "Kullanmadan önce küçük bir bölgede test edilmesi önerilir": "Patch test on a small area before use",
    "Cilt profilinize uygun değil; tahriş ve parlama riski yüksek, gereksiz harcamadan kaçının.": "Not suitable for your skin profile; high risk of irritation and shine. Avoid the unnecessary spend.",
    "Cildinizle yüksek uyum sağlıyor ve dolabınızda çakışan benzer bir ürün bulunmuyor.": "Highly compatible with your skin and nothing similar on your shelf.",
    "Tek katta belirgin uzunluk ve sıfır topaklanma": "Clear length in a single coat with no clumping",
    "8+ saat boyunca dökülme yapmayan dayanıklı tutuş": "Holds for 8+ hours without flaking",
    "Suya ve tere tam dayanıklı akmayan formül": "Fully water and sweat resistant, no smudging",
    "Kirpikleri ağırlaştırmadan kolay temizlenen yapı": "Removes easily without weighing lashes down",
    "Çok kat sürülürse hafif kalınlaşabilir": "Can look slightly thick if layered",
    "Çıkarmak için çift aşamalı temizleyici gerekir": "Needs a double cleanse to remove",
    "Yağlı göz kapaklarında gün sonu hafif bulaşma yapabilir": "May smudge slightly on oily lids by evening",
    "Sosyal medya filtrelerine aldanmayın; takma kirpik etkisi yerine doğal uzunluk sağlar.": "Do not trust social media filters; it gives natural length, not a false-lash effect.",
    "Dudak çizgilerine dolmayan pürüzsüz ve kadife doku": "Smooth, velvety texture that does not settle into lip lines",
    "Tek sürüşte yüksek örtücülük ve net renk": "High coverage and clear color in one swipe",
    "Dudakta ağırlık ve yapışkanlık hissi bırakmaz": "No heaviness or stickiness on the lips",
    "Yemek ve içecek sonrası hafif tazeleme gerektirir": "Needs a light touch-up after eating and drinking",
    "Kuru dudaklarda pürüzsüz durması için öncesinde nemlendirici ister": "Needs a lip balm underneath on dry lips",
    "Stüdyo ışıklarındaki aşırı parlaklığa aldanmayın; gün ışığında daha doğal durur.": "Do not trust the shine under studio lights; it looks more natural in daylight.",
    "Hızlı emilir; ciltte beyazlık ve yapışkanlık bırakmaz": "Absorbs fast with no white cast or stickiness",
    "Makyaj altında kusma ve soyulma yapmayan pürüzsüz bitiş": "Smooth finish under makeup without pilling",
    "Fotostabil yüksek UV filtreleriyle güçlü koruma": "Strong protection with photostable UV filters",
    "Göz çevresine çok yakın sürülürse terlemeyle hafif yanma yapabilir": "May sting slightly with sweat if applied too close to the eyes",
    "Çok yağlı ciltlerde gün ortası hafif parlama yapabilir": "May look slightly shiny by midday on very oily skin",
    "Sosyal medyadaki az sürme trendlerine uymayın; iki parmak kuralı uygulayın.": "Ignore the apply-less trend on social media; use the two-finger rule.",
    "Hızlı emilen, ağırlık yapmayan su bazlı hafif doku": "Fast-absorbing, lightweight water-based texture",
    "Düzenli kullanımda gözenek ve doku pürüzlerini gözle görülür azaltır": "Visibly reduces pores and uneven texture with regular use",
    "Rutinlerdeki nemlendirici ve kremlerle rahat katmanlanır": "Layers easily with moisturizers and creams",
    "Güçlü asitlerle aynı anda uygulanırsa hafif karıncalanma yapabilir": "May tingle if applied together with strong acids",
    "Fazla uygulanırsa makyaj altında pütürlenme yapabilir": "May ball up under makeup if over-applied",
    "Bir gecede cam cilt vaatleri gerçek dışıdır; sonuç için 4 hafta düzenli kullanım gerekir.": "Overnight glass-skin promises are unrealistic; expect results after 4 weeks of regular use.",
    "8+ saat boyunca güvenilir sebum ve parlama kontrolü": "Reliable oil and shine control for 8+ hours",
    "Kızarıklık ve lekeleri tek katta tamamen örten formül": "Fully covers redness and blemishes in a single layer",
    "Sabitlendikten sonra bulaşmaya karşı yüksek direnç": "Highly smudge-resistant once set",
    "Kuru bölgelere tutunabilir; altına iyi nemlendirici ister": "Can cling to dry areas; needs a good moisturizer underneath",
    "Kururken yarım ton oksitlenme yapabilir": "May oxidize half a shade darker as it dries",
    "Filtreli videolara aldanmayın; kalın durmaması için nemli süngerle az miktarda uygulayın.": "Do not trust filtered videos; apply a small amount with a damp sponge to avoid a heavy look.",
    "Kuru pullara tutunmayan taze ve aydınlık görünüm": "Fresh, luminous look that does not cling to dry flakes",
    "Cildi boğmayan nefes alan hafif yapı": "Breathable, lightweight feel",
    "Ağır mat fondötenlere kıyasla minimum oksitlenme": "Minimal oxidation compared with heavy matte foundations",
    "Yağlı T bölgesinde gün ortası pudra tazelemesi ister": "Needs a powder touch-up on an oily T-zone by midday",
    "Bulaşmayı önlemek için hafif sabitleme gerektirir": "Needs light setting to prevent transfer",
    "Gün boyu ağırlık yapmayan nefes alan hafif doku": "Lightweight, breathable texture that stays comfortable all day",
    "Gözenekleri pürüzsüzleştiren homojen kapatıcılık": "Even coverage that smooths pores",
    "Farklı hava koşullarında yapısını koruyan denge": "Holds up well in changing weather",
    "Kurudukça yarım ton koyulaşma gözlemlenebilir": "May darken half a shade as it dries",
    "T bölgesinde gün ortası hafif pudra isteyebilir": "May need light powder on the T-zone by midday",
    "16 saat parlama yapmama iddiası yağlı ciltler için geçerli değildir.": "The 16-hour no-shine claim does not hold for oily skin.",
    "Ton seçerken mağaza ışıkları yerine gün ışığında deneyin.": "Test shades in daylight rather than store lighting.",
    "Az miktarla bile tam örtücülük sağlayan yüksek pigment": "High pigment gives full coverage even in small amounts",
    "İnce mimik çizgilerine hemen dolma ve birikme yapmaz": "Does not settle into fine lines",
    "Gün içi pratik rötuşlar sağlayan kullanışlı aplikatör": "Handy applicator for quick touch-ups",
    "Çizgilere dolmaması için hafif transparan pudra ister": "Needs a light translucent powder to avoid creasing",
    "Bazı tonları kurudukça hafif daha sıcak kalabilir": "Some shades may turn slightly warmer as they dry",
    "Sosyal medya yorumları ilk izlenime odaklıdır; uzun süreli performansı inceleyin.": "Social media reviews focus on first impressions; check long-term performance.",
    "Videolardaki yoğun üçgen uygulamalar yerine birkaç nokta yeterlidir.": "A few dots are enough; skip the heavy triangle application seen in videos.",
    "Ton seçerken mağaza ışıkları yerine gün ışığında deneyin": "Test shades in daylight rather than store lighting.",
    "Alerjik reaksiyon ve kontakt dermatit riski nedeniyle bu ürünü doğrudan atlayın.": "Skip this product: risk of allergic reaction and contact dermatitis.",
    "Güvenli alternatif: Bakuchiol, Azelaik Asit veya Hyalüronik Asit formülleri tercih edin.": "Safer alternative: choose Bakuchiol, Azelaic Acid or Hyaluronic Acid formulas.",
    "Alkol ve mentol içermeyen, Centella Asiatica / Pantenol bazlı yatıştırıcı ürünlere yönelin.": "Choose soothing products without alcohol or menthol, based on Centella Asiatica or Panthenol.",
}

# Product summary sentences: "<name>, <suffix>" -> "<name> <en>"
SUFFIX_TR_TO_EN = {
    ", günlük kullanım için konforlu ve dengeli bir kozmetik ürünüdür.": " is a comfortable, balanced everyday cosmetic.",
    ", kirpikleri tel tel ayıran ve kıvrık tutan maskaradır.": " is a mascara that separates and curls lashes.",
    ", tek sürüşte net renk veren konforlu dudak ürünüdür.": " is a comfortable lip product with clear color in one swipe.",
    ", geniş spektrumlu UVA/UVB koruması sağlayan hafif günlük güneş koruyucudur.": " is a lightweight daily sunscreen with broad-spectrum UVA/UVB protection.",
    ", cilt bariyerini ve tonunu hedefleyen konsantre aktif bakım serumudur.": " is a concentrated active serum targeting the skin barrier and tone.",
    ", koyu halkaları ve lokal lekeleri hedefleyen hedefe yönelik kapatıcıdır.": " is a targeted concealer for dark circles and spot blemishes.",
    ", parlamayı önleyen ve kusurları örten yüksek kapatıcı mat fondötendir.": " is a full-coverage matte foundation that controls shine and hides imperfections.",
    ", cilde doğal ışıltı ve canlılık veren nemlendirici fondötendir.": " is a hydrating foundation that gives skin a natural glow.",
    ", doğal saten bitişli ve dengeli orta kapatıcılık sunan günlük fondötendir.": " is an everyday foundation with balanced medium coverage and a natural satin finish.",
}

# Static English -> Turkish sentences (keys are written as produced, then normalized by clean()).
_EN_TO_TR_RAW = {
    "SENSITIVE EYE CAUTION: If you wear contact lenses or have sensitive eyes, check for ophthalmologist testing and avoid applying too close to the waterline.": "Hassas göz uyarısı: Lens kullanıyorsanız veya gözleriniz hassassa, oftalmolog testli ürünleri tercih edin ve su çizgisine çok yaklaşmayın.",
    "LASH HEALTH: Waterproof formulas require gentle bi-phase oil removal. Do not rub aggressively to prevent eyelash breakage.": "Kirpik sağlığı: Suya dayanıklı formüller çift fazlı yağ bazlı temizleyiciyle nazikçe çıkarılmalıdır. Kirpik kırılmasını önlemek için sert ovmayın.",
    "LIP SENSITIVITY: Flavored or plumping lip products containing menthol/fragrance can cause mild tingling or dryness on sensitive lips.": "Dudak hassasiyeti: Mentol veya parfüm içeren aromalı ve dolgunlaştırıcı ürünler hassas dudaklarda hafif karıncalanma veya kuruluk yapabilir.",
    "ROSACEA FLARE-UP ALERT: Detected vascular triggers (alcohol/fragrance/acids) that can provoke capillary flushing and stinging.": "Roza uyarısı: Kılcal damarlarda kızarma ve yanmaya yol açabilen tetikleyiciler (alkol/parfüm/asit) tespit edildi.",
    "COMEDOGENIC ALERT: Contains known pore-clogging ingredients that can trigger closed comedones and breakout flares.": "Komedojenik uyarı: Gözenek tıkayan, sivilce ve siyah nokta oluşturabilen bileşenler içeriyor.",
    "ROSACEA SPF NOTE: Chemical UV filters convert UV into heat, which can trigger facial redness. Prefer Zinc Oxide mineral formulas.": "Roza SPF notu: Kimyasal UV filtreleri ısı üretir ve kızarıklığı tetikleyebilir. Çinko oksitli mineral formülleri tercih edin.",
    "ACNE-PRONE CAUTION: Rich radiant foundation oils can congest active acne if worn for extended hours without proper double cleansing.": "Akneye yatkın ciltler için uyarı: Yağlı ışıltılı fondötenler, uzun süre ve düzgün çift temizleme yapılmadan kullanılırsa akneyi artırabilir.",
    "ROSACEA BARRIER NOTE: Fast-drying matte foundations can feel tight on compromised barriers. Use a rich soothing cream underneath.": "Roza bariyer notu: Hızlı kuruyan mat fondötenler zayıf cilt bariyerinde gerginlik yapabilir. Altına yatıştırıcı bir krem sürün.",
    "Gentle on sensitive eye areas when removed without excessive tugging.": "Fazla çekiştirmeden çıkarıldığında hassas göz çevresinde nazik davranır.",
    "Harmonizes naturally with warm/golden undertones (terracotta, peach, warm nude shades).": "Sıcak/altın alt tonlarla doğal uyum sağlar (kiremit, şeftali, sıcak nude tonlar).",
    "Watch out for slight oxidation which can make neutral-warm shades appear slightly orange.": "Hafif oksitlenmeye dikkat: nötr-sıcak tonlar hafif turuncuya dönebilir.",
    "Since you have oilier skin, this waterproof/smudge-proof formula protects against sebum transfer from the eyelids.": "Cildiniz yağlı olduğu için bu suya dayanıklı/bulaşmaz formül göz kapağındaki sebumdan korunmanıza yardımcı olur.",
    "For oily lids, set your eye area with translucent powder to prevent midday mascara transfer.": "Yağlı göz kapaklarında, gün ortası bulaşmayı önlemek için göz çevresini transparan pudrayla sabitleyin.",
    "Complements cool undertones best with berry, rose, or blue-red tones.": "Soğuk alt tonları en iyi orman meyvesi, gül ve mavi-kırmızı tonlarla tamamlar.",
    "Excellent match for your oily skin type: matte oil-absorbing polymers actively control excess sebum.": "Yağlı cilt tipinize mükemmel uyum: mat, yağ emici polimerler fazla sebumu kontrol eder.",
    "Opt for cool/rose undertone labels so oxidation doesn't pull overly yellow.": "Oksitlenmenin fazla sarıya çekmemesi için soğuk/gül alt tonlu etiketleri seçin.",
    "Caution for your dry skin type: this matte formula can cling to dry patches unless paired with an intensely hydrating primer.": "Kuru cilt tipiniz için uyarı: bu mat formül, yoğun nemlendirici bir baz olmadan kuru bölgelere tutunabilir.",
    "Ideal match for your dry skin type: luminous emollients prevent flaking and maintain hydration.": "Kuru cilt tipinize ideal: ışıltılı yumuşatıcılar pullanmayı önler ve nemi korur.",
    "Moderate match for sensitive skin: long-wear film formers require gentle double-cleansing.": "Hassas cilt için orta uyum: uzun süre kalıcı film yapıcılar nazik çift temizleme gerektirir.",
    "Good match for your combination skin: apply primarily to the T-zone and keep a lighter layer on cheeks.": "Karma cilt tipinize iyi uyum: ağırlıklı olarak T bölgesine sürün, yanaklarda daha hafif tutun.",
    "Low-to-moderate match for oily skin: radiant dewy formulas can slide off the T-zone by midday.": "Yağlı cilt için düşük-orta uyum: ışıltılı nemli formüller gün ortasında T bölgesinden kayabilir.",
    "Universal mascara formulation evaluated for lash definition and curl retention.": "Kirpik belirginliği ve kıvrım kalıcılığı açısından değerlendirilen genel kullanım maskara formülü.",
}
EN_TO_TR: Dict[str, str] = {}

_WORDS_TR = {"oily": "yağlı", "dry": "kuru", "combination": "karma", "sensitive": "hassas", "normal": "normal", "matte": "mat", "glossy": "parlak"}

_TOPIC = {"Alerji": "Allergy", "Hamilelik": "Pregnancy", "Roza / Kılcal Damar": "Rosacea"}

# Dynamic sentences: (regex, English template, Turkish template). Groups map to {1}, {2}.
_DYNAMIC = [
    (r"^Alerji: Bildirilen hassasiyetinizle eşleşen '(.+)' bileşeni saptandı\.$",
     "Allergy: contains '{1}', which matches your reported sensitivity.",
     "Alerji: Bildirdiğiniz hassasiyetle eşleşen '{1}' bileşeni saptandı."),
    (r"^Hamilelik: Üründe '(.+)' tespit edildi\. .*$",
     "Pregnancy: contains '{1}'. Retinoids and high-strength acids are not recommended during pregnancy or breastfeeding.",
     "Hamilelik: Üründe '{1}' tespit edildi. Hamilelik ve emzirme döneminde retinoid ve yüksek asitler önerilmez."),
    (r"^Roza / Kılcal Damar: Damar genişletici '(.+)' içeriyor\. .*$",
     "Rosacea: contains '{1}', a vasodilator that may cause sudden flushing and burning.",
     "Roza: Damar genişletici '{1}' içeriyor; ani kızarma ve yanma hissi yaratabilir."),
    (r"^Dolabınızda zaten yüksek puanlı benzer bir ürün \((.+)\) var; yeni alım gereksiz\.$",
     "You already own a similar high-rated product ({1}); a new purchase is unnecessary.",
     "Dolabınızda zaten yüksek puanlı benzer bir ürün ({1}) var; yeni alım gereksiz."),
    (r"^Texture and formulation are well-suited for (.+) skin routines\.$",
     "Texture and formulation are well-suited for {1} skin routines.",
     "Doku ve formül {1} cilt rutinleri için uygundur."),
    (r"^Flattering (.+) lip product suited for your beauty routine\.$",
     "Flattering {1} lip product suited for your beauty routine.",
     "Bakım rutininize uygun, yakışan {1} dudak ürünü."),
    (r"^Balanced satin formula that adapts naturally to your (.+) skin profile\.$",
     "Balanced satin formula that adapts naturally to your {1} skin profile.",
     "{1} cilt profilinize doğal olarak uyum sağlayan dengeli saten formül."),
    (r"^Strong match for your (.+) skin, providing a healthy glow when the T-zone is lightly set\.$",
     "Strong match for your {1} skin, providing a healthy glow when the T-zone is lightly set.",
     "{1} cildinize güçlü uyum: T bölgesi hafifçe sabitlendiğinde sağlıklı bir ışıltı verir."),
    (r"^Allergen match: Contains '(.+)', matching your declared sensitivity profile!$",
     "Allergen match: contains '{1}', matching your declared sensitivity.",
     "Alerjen eşleşmesi: Bildirdiğiniz hassasiyetle eşleşen '{1}' içeriyor."),
    (r"^Sponsored Tag \(#ad / #işbirliği\) detected in (.+)\. Treat extreme performance claims with caution\.$",
     "Sponsored post detected in {1}. Treat extreme performance claims with caution.",
     "{1} içinde sponsorlu paylaşım tespit edildi. Aşırı performans iddialarına temkinli yaklaşın."),
]


def clean(text: str) -> str:
    """Remove emoji and developer markers such as 'GUARDRAIL VETO (...)'."""
    text = _EMOJI.sub("", text).strip()
    text = _GUARD.sub(lambda m: f"{m.group(1)}: ", text)
    text = _CAPS_LABEL.sub(lambda m: m.group(1).capitalize() + ": ", text)
    return text


EN_TO_TR.update({clean(k): v for k, v in _EN_TO_TR_RAW.items()})


def localize_text(text: Any, lang: str) -> Any:
    if not isinstance(text, str) or not text:
        return text
    text = clean(text)
    for pattern, en, tr in _DYNAMIC:
        m = re.match(pattern, text)
        if m:
            tpl = en if lang == "en" else tr
            word = (lambda w: _WORDS_TR.get(w, w)) if lang == "tr" else (lambda w: w)
            return re.sub(r"\{(\d)\}", lambda g: word(m.group(int(g.group(1)))), tpl)
    if lang == "tr":
        return EN_TO_TR.get(text, text)
    if lang == "en":
        if text in TR_TO_EN:
            return TR_TO_EN[text]
        for suffix, en in SUFFIX_TR_TO_EN.items():
            if text.endswith(suffix):
                return text[: -len(suffix)] + en
    return text


def localize_report(report: Dict[str, Any], lang: str) -> Dict[str, Any]:
    """Return a copy of the report with clean, language-consistent text."""
    out = dict(report)
    for key in ("summary", "suitability_reason", "reality_check_reason"):
        out[key] = localize_text(out.get(key), lang)
    for key in ("pros", "cons", "clinical_warnings", "sponsored_flags"):
        items: List[Any] = out.get(key) or []
        out[key] = [localize_text(i, lang) for i in items]
    return out
