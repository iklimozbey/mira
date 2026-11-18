import { Language } from './translations';

// Smart cosmetic bilingual dictionary for phrases, reasons, pros, cons, and catalog items
const enToTrDictionary: Record<string, string> = {
  // Foundations & Coverage
  'offers balanced medium coverage with a natural satin finish suitable for versatile daily wear.':
    'günlük kullanım için ideal, doğal saten bitişli ve dengeli orta kapatıcılık sunar.',
  'delivers a luminous, skin-like finish with buildable medium coverage and hydrating emollients.':
    'nemlendirici içerikleriyle cilde canlı, aydınlık ve kat kat uygulanabilir bir kapatıcılık sağlar.',
  'delivers a soft-matte, shine-free finish engineered for maximum sebum absorption and longevity.':
    'maksimum parlama kontrolü ve uzun süre kalıcılık için geliştirilmiş yumuşak mat bir bitiş sağlar.',
  'is a targeted corrector formulated to neutralize dark circles and spot-conceal blemishes.':
    'koyu halkaları nötrlemek ve lokal lekeleri kapatmak için formüle edilmiş hedefe yönelik bir kapatıcıdır.',
  'is a versatile cosmetic product balancing performance with comfortable daily wear.':
    'günlük kullanım konforu ile performansı dengeleyen çok yönlü bir kozmetik ürünüdür.',

  // Skin Rationale
  'Balanced satin formula that adapts naturally to your dry skin profile.':
    'Kuru cilt profilinize doğal olarak uyum sağlayan ve pullanma yapmayan dengeli saten formül.',
  'Balanced satin formula that adapts naturally to your oily skin profile.':
    'Yağlı cilt profilinizde parlama yapmadan gözenekleri dengeleyen doğal saten formül.',
  'Balanced satin formula that adapts naturally to your combination skin profile.':
    'Karma cilt profilinizin T bölgesini dengelerken yanaklarda kuruluk hissi bırakmayan formül.',
  'Balanced satin formula that adapts naturally to your sensitive skin profile.':
    'Hassas cilt profilinizi yormayan, ağırlık yapmayan konforlu ve dengeli saten formül.',

  // Reality Check
  'You don\'t have a conflicting foundation logged in your shelf yet, and this product scores well.':
    'Dolabınızda henüz bu ürünle çakışan bir ürün bulunmuyor ve ürün yüksek uyum puanına sahip.',
  'You don\'t have a conflicting product logged in your shelf yet, and this product scores well.':
    'Dolabınızda henüz bu ürünle çakışan bir ürün bulunmuyor ve genel değerlendirmeleri oldukça başarılı.',
  'You already own similar high-rated products in this category on your shelf.':
    'Dolabınızda bu kategoride zaten yüksek puanlı benzer ürünleriniz bulunuyor; satın alma öncesi değerlendirin.',

  // Pros
  'Weightless breathable texture that stays comfortable all day':
    'Gün boyu konforlu kalan, ağırlık yapmayan nefes alabilen hafif doku',
  'Blurs minor pore texture without looking heavy':
    'Ağır ve maske gibi durmadan gözenek dokusunu hafifçe pürüzsüzleştirir',
  'Adapts well across changing weather conditions':
    'Farklı hava koşullarında ve sıcaklıklarda yapısını başarıyla korur',
  'Healthy radiant glow that avoids clinging to dry flakes':
    'Kuru pullara tutunmayan, cilde sağlıklı ve ışıltılı doğal parlaklık veren yapı',
  'Seamless blendability and breathable skin feel':
    'Kolayca dağılan pürüzsüz akışkanlık ve cildi boğmayan hafif his',
  'Minimal oxidation compared to heavy matte formulas':
    'Ağır mat fondötenlere kıyasla gün içinde minimum düzeyde oksitlenme',
  'Controls midday shine and resists humidity and sweat':
    'Gün ortasındaki parlamayı kontrol altına alır, neme ve tere karşı dirençlidir',
  'Does not transfer onto collars or phone screens easily':
    'Kıyafet yakalarına veya telefon ekranına kolayca transfer olmaz',
  'High opacity pigment that covers discoloration with a minimal amount of product':
    'Az miktarda ürünle bile renk eşitsizliklerini ve lekeleri örten yüksek pigment',
  'Does not migrate immediately into fine under-eye expression lines':
    'Göz altındaki ince mimik çizgilerine hemen dolma veya birikme yapmaz',
  'Convenient applicator for on-the-go spot touch-ups':
    'Gün içinde pratik rötuşlar yapmayı kolaylaştıran kullanışlı aplikatör',
  'Reliable formulation from an established brand':
    'Kullanıcılar tarafından güvenilen, kendini kanıtlamış dengeli formül',
  'Smooth application and good blendability':
    'Cilt üzerinde pürüzsüz uygulama ve zahmetsiz homojen dağılım',
  'Accessible for everyday beauty routines':
    'Günlük makyaj ve bakım rutini için son derece pratik ve uyumlu',

  // Cons
  'Slight oxidation (half a shade darker) reported by users with higher skin acidity':
    'Cilt asiditesi yüksek kullanıcılarda kurudukça hafif oksitlenme (yarım ton koyulaşma) gözlemlenebilir',
  'May require a midday powder touch-up in the T-zone':
    'Özellikle T bölgesinde gün ortasında hafif bir pudra tazelemesi gerektirebilir',
  'Can break down around the nose and forehead after 4-5 hours on oilier skin types':
    'Yağlı cilt tiplerinde 4-5 saat sonra burun kenarlarında hafif parlama ve dağılma yapabilir',
  'Requires translucent setting powder on the center of the face to prevent transfer':
    'Transferi ve parlamayı tamamen kesmek için yüzün merkezinde transparan pudra ister',
  'Can cling to dry patches or emphasize textural lines without thorough moisturizing prep':
    'İyi nemlendirilmemiş kuru bölgelere tutunabilir veya pürüzleri belirginleştirebilir',
  'Users note potential 0.5 to 1 shade of oxidation as volatile film-formers dry':
    'Sabitleyiciler kururken yarım ila bir ton oksitlenme yapabildiği için ton seçimine dikkat edilmeli',
  'Needs a light dusting of translucent powder to prevent creasing after 4-5 hours':
    '4-5 saat sonra çizgilere dolmaması için hafif bir transparan sabitleyici pudra tavsiye edilir',
  'Certain shades run warmer or oxidize slightly darker under-eye':
    'Bazı alt ton seçenekleri göz altında beklenenden hafif daha sıcak veya koyu kalabilir',
  'Individual longevity varies depending on skin prep and environmental humidity':
    'Kalıcılığı cilt hazırlığına ve bulunulan ortamın nem oranına göre değişiklik gösterebilir',
  'Patch-testing is recommended before daily use':
    'Düzenli kullanıma geçmeden önce küçük bir bölgede yama testi yapılması tavsiye edilir',

  // Clinical & Ad Flags
  'Contains comedogenic isopropyl isostearate - trigger for acne':
    'Komedojenik izopropil izostearat içerir - gözenek tıkanması ve akne riski',
  'Safe for sensitive rosacea-prone skin; fragrance-free':
    'Hassas ve rozaseaya yatkın ciltler için güvenli; kokusuz ve tahriş etmeyen içerik',
  'Moderate social media seeding detected; always check shade swatches in natural indirect daylight.':
    'Sosyal medyada yoğun tanıtım kampanyası mevcuttur; renk tonunu doğrudan gün ışığında incelemeniz önerilir.',
};

const trToEnDictionary: Record<string, string> = {
  // Badges & Taglines
  '16 Saat Kalıcı Parlak': '16HR Longwear Vinyl Shine',
  'Hyaluronik Asitli Parlatıcı': 'Hyaluronic Acid Plump Gloss',
  'Ultra Mat Likit': 'Ultra-Matte Liquid Lipstick',
  'Konforlu Klasik Ruj': 'Comfortable Creamy Matte Lipstick',
  'Sonsuz Uzunluk': 'Endless Lash Length',
  'Yelpaze Hacim': 'Fan-Out Lash Volume',
  'Gözenek Gizleyici Mat': 'Pore-Blurring Matte Foundation',
  'Hafif Işıltılı Mat': 'Lumi-Matte Radiant Foundation',
  'Nefes Alan Saten': 'Breathable Fresh Satin Wear',
  'Taraklı Ekstra Uzunluk': 'Combed Extra Lash Extension',
  'Kült Mat Ruj': 'Cult Classic Retro Matte',
  'Görünmez Akışkan SPF 50+': 'Invisible Fluid SPF 50+',
  'Yoğun Bariyer Onarıcı': 'Intense Barrier Repair Balm',

  // Suggestions Pros & Cons
  'Bulaşmayan, 16 saat kalıcı parlak vinyl bitiş':
    'Transfer-resistant, 16-hour longwear glossy vinyl finish',
  'Çıkarmak için çift aşamalı yağ bazlı temizleyici şart':
    'Requires a dual-phase oil-based cleanser to remove thoroughly',
  'Dudakları yakmadan anında dolgunlaştırır ve nemlendirir':
    'Instantly plumps and deeply hydrates lips without burning sensation',
  'Yapışkan hissi az ama yemek sonrası tazeleme ister':
    'Minimal stickiness but requires reapplication after meals',
  'Yemeğe, içeceğe ve maskeye tam dayanıklı sıfır transfer':
    'Completely food, drink, and transfer-proof with zero smudging',
  'Dudağı kurutabilir, öncesinde nemlendirici balm şart':
    'Can feel drying on lips; applying a hydrating balm beforehand is recommended',
  'Dudak çizgilerine dolmayan yumuşak saten-mat doku':
    'Comfortable satiny texture that avoids settling into fine lip lines',
  'Likit rujlar kadar uzun süre kalıcı değil':
    'Not as ultra long-wearing as liquid transfer-proof formulas',
  'Esnek fırçasıyla en kısa kirpikleri bile tel tel uzatır':
    'Flexible wand lifts and noticeably lengthens even the shortest lashes',
  'İki kattan fazla sürülürse hafif topaklanma yapabilir':
    'Can clump slightly if more than two coats are applied',
  'Kıvrık fırçasıyla kirpikleri dipten kaldırır ve hacim verir':
    'Curved brush lifts lashes from the root and delivers bold volume',
  'Göz kapağı çok yağlıysa gün sonuna doğru hafif akma yapabilir':
    'May smudge slightly towards the end of the day on very oily eyelids',
  'T bölgesindeki parlamayı alır ve gözenekleri pürüzsüzleştirir':
    'Controls T-zone shine and blurs out visible pore texture',
  'Kuru bölgelere tutunur, yarım ton oksitlenme yapabilir':
    'May cling to flaky areas and oxidize approximately half a shade darker',
  'Maske hissi vermeyen nefes alan hafif yüksek kapatıcılık':
    'Breathable medium-to-high coverage that never feels heavy or mask-like',
  'Kuru ciltlerde gün içinde pudralı görünebilir':
    'May appear slightly powdery on dry skin types as the day progresses',
  'Terlemeye dayanıklı, cildi boğmayan doğal saten bitiş':
    'Sweat-resistant, non-comedogenic natural satin wear',
  'Oksitlenmemesi için bir ton açık renk seçilmeli':
    'Consider choosing half a shade lighter to compensate for minor oxidation',
  'Düz tarak uçlu fırçasıyla kirpikleri yapıştırmadan uzatır':
    'Fine comb brush separates lashes cleanly while maximizing length',
  'Hacimden ziyade sadece uzunluk odaklı bir üründür':
    'Focuses predominantly on extreme length rather than dramatic thickness',
  'Tek sürüşte yoğun renk veren dünyaca ünlü ikonik matlık':
    'Single-swipe saturated pigment with world-famous iconic matte finish',
  'Dudakta kuruluk hissi bırakabilir, pürüzsüz dudak ister':
    'Can feel dry on chapped lips; smooth exfoliation before wear is best',
  'Beyazlık bırakmaz, göz yakmaz, makyaj altında soyulmaz':
    'Zero white cast, non-stinging around eyes, and wears smoothly under makeup',
  'Çok yağlı ciltlerde gün ortasında hafif parlama yapabilir':
    'May generate mild shine around midday on excessively oily skin',
  'Rozasea kızarıklığını ve tahriş olmuş bariyeri anında yatıştırır':
    'Instantly calms Rosacea redness and restores compromised skin barrier',
  'Ağır yapılıdır, akneli yağlı ciltler sadece ince tabaka sürmeli':
    'Rich balmy texture; acne-prone or oily skin should apply only a very thin layer',

  // Categories & Headers
  'En Çok Tercih Edilen Maybelline Rujları': 'Top-Rated Maybelline Lipsticks',
  'En Çok Tercih Edilen Maybelline Fondötenleri': 'Top-Rated Maybelline Foundations',
  'En Çok Tercih Edilen Maybelline Maskaraları': 'Top-Rated Maybelline Mascaras',
  'En Çok Tercih Edilen Maybelline Güneş Kremleri': 'Top-Rated Maybelline Sunscreens',
  'Puan ve değerlendirme sayısına göre sıralandı': 'Ranked by highest user ratings and verified review count',
};

/**
 * Automatically translates content (sentences, pros, cons, reasons, badges)
 * between English and Turkish based on the target language.
 */
export function translateText(text?: string | null, targetLang: Language = 'tr'): string {
  if (!text) return '';
  const trimmed = text.trim();

  if (targetLang === 'tr') {
    // Check direct dictionary match
    if (enToTrDictionary[trimmed]) {
      return enToTrDictionary[trimmed];
    }

    // Dynamic pattern matchers for AI-generated sentences
    if (/Balanced satin formula that adapts naturally to your (\w+) skin profile/i.test(trimmed)) {
      const match = trimmed.match(/your (\w+) skin profile/i);
      const skin = match ? match[1].toLowerCase() : '';
      const skinTr = skin === 'dry' ? 'kuru' : skin === 'oily' ? 'yağlı' : skin === 'combination' ? 'karma' : skin === 'sensitive' ? 'hassas' : 'normal';
      return `${skinTr.charAt(0).toUpperCase() + skinTr.slice(1)} cilt profilinize doğal olarak uyum sağlayan ve gün boyu konforlu saten bitiş sunan formül.`;
    }

    if (/Ideal match for your (\w+) skin/i.test(trimmed)) {
      const match = trimmed.match(/your (\w+) skin/i);
      const skin = match ? match[1].toLowerCase() : '';
      const skinTr = skin === 'dry' ? 'kuru' : skin === 'oily' ? 'yağlı' : skin === 'combination' ? 'karma' : 'hassas';
      return `${skinTr.charAt(0).toUpperCase() + skinTr.slice(1)} cilt tipiniz için mükemmel uyum: Işıltılı nemlendiriciler pullanmayı önler ve nemi korur.`;
    }

    if (/Good match for your combination skin/i.test(trimmed)) {
      return 'Karma cildiniz için dengeli uyum: Öncelikle T bölgesine uygulayın ve yanaklarda hafif bir katman bırakın.';
    }

    if (/Strong match for your (\w+) skin/i.test(trimmed)) {
      const match = trimmed.match(/your (\w+) skin/i);
      const skin = match ? match[1].toLowerCase() : '';
      const skinTr = skin === 'dry' ? 'kuru' : skin === 'oily' ? 'yağlı' : skin === 'combination' ? 'karma' : 'hassas';
      return `${skinTr.charAt(0).toUpperCase() + skinTr.slice(1)} cildiniz için güçlü uyum: T bölgesi hafif sabitlendiğinde sağlıklı ışıltı sağlar.`;
    }

    if (/Low-to-moderate match for oily skin/i.test(trimmed)) {
      return 'Yağlı cilt için orta-düşük uyum: Islak ve aydınlık bitişli formüller gün ortasında T bölgesinde parlama yapabilir.';
    }

    if (/Texture and formulation are well-suited for (\w+) skin/i.test(trimmed)) {
      const match = trimmed.match(/for (\w+) skin/i);
      const skin = match ? match[1].toLowerCase() : '';
      const skinTr = skin === 'dry' ? 'kuru' : skin === 'oily' ? 'yağlı' : skin === 'combination' ? 'karma' : 'hassas';
      return `Dokusu ve formülasyonu ${skinTr} cilt bakım rutininiz için oldukça uygundur.`;
    }

    if (/Fits your criteria well. Verify your current makeup shelf/i.test(trimmed)) {
      return 'Kriterlerinize uygun bir ürün. Satın almadan önce dolabınızdaki benzer ürünleri kontrol etmeniz önerilir.';
    }

    if (/You don't have a conflicting (.*) logged in your shelf yet/i.test(trimmed)) {
      return 'Dolabınızda henüz bu ürünle çakışan bir ürün bulunmuyor ve ürün yüksek uyum puanına sahip.';
    }

    if (/Shelf Redundancy: You already own a highly-rated (.*)/i.test(trimmed)) {
      return 'Dolap Kontrolü: Dolabınızda bu kategoride zaten yüksek puanlı bir ürününüz mevcut. Bitmeden yenisini almak gereksiz harcama olabilir.';
    }

    // Partial product name replacements (e.g. "Maybelline Fit Me offers balanced...")
    for (const [enKey, trVal] of Object.entries(enToTrDictionary)) {
      if (trimmed.toLowerCase().includes(enKey.toLowerCase())) {
        return trimmed.replace(new RegExp(enKey, 'gi'), trVal);
      }
    }
    return trimmed;
  } else {
    // Target is English
    if (trToEnDictionary[trimmed]) {
      return trToEnDictionary[trimmed];
    }
    for (const [trKey, enVal] of Object.entries(trToEnDictionary)) {
      if (trimmed.toLowerCase().includes(trKey.toLowerCase())) {
        return trimmed.replace(new RegExp(trKey, 'gi'), enVal);
      }
    }
    return trimmed;
  }
}
