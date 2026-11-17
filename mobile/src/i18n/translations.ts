export type Language = 'tr' | 'en';

export const translations = {
  tr: {
    // Header & Navigation
    appTitle: 'MIRA ARAŞTIRMA',
    tabSearch: 'Arama',
    tabShelf: 'Dolabım',
    tabHistory: 'Geçmiş',
    tabSettings: 'Ayarlar',
    newSearch: '← Yeni Arama',
    profileTag: 'CİLT',

    // Auth & Onboarding
    authSubtitle: 'Kişiselleştirilmiş Güzellik & Alışveriş Araştırması',
    emailPlaceholder: 'E-posta adresi',
    passwordPlaceholder: 'Şifre',
    signIn: 'Giriş Yap',
    quickDemo: 'Hızlı Demo Girişi (Tek Dokunuş)',
    createAccount: 'Hesap Oluştur',
    onboardingTitle: 'Cildinizi MIRA\'ya Anlatın',
    onboardingSubtitle: 'Kişiselleştirilmiş uyum puanlarını kalibre etmek için hızlıca yanıtlayın.',
    startResearching: 'Araştırmaya Başla',

    // Search Screen
    searchPrompt: 'Hangi ürünü incelemek istersiniz?',
    searchPlaceholder: 'Ürün adı veya link yapıştırın...',
    analyzeBtn: 'Ürünü Analiz Et',
    searchMicroHint: 'MIRA; gerçek kullanıcı yorumlarını, Rozasea/Akne tetikleyicilerini ve dolap tekrarını denetler.',
    analyzing: 'MIRA cildiniz için analiz ediyor...',

    // Product Report
    reportTitle: 'Ürün Analiz Raporu',
    match: 'UYUM',
    skinAnalysisTitle: 'CİLT UYUM ANALİZİ',
    shelfCheckTitle: 'DOLAP & İHTİYAÇ KONTROLÜ',
    clinicalCaution: 'Klinik & Dermatolojik Uyarı',
    addToShelf: '+ Dolabıma / İstek Listeme Ekle',
    addedToShelf: 'Ürün dolabınıza eklendi!',
    bottomSearchPlaceholder: 'Başka bir ürün adı veya link yazın...',
    searchBtn: 'Ara',

    // Suggestions Screen
    productChoices: 'Ürün Seçenekleri',
    rankedSub: 'Kullanıcı puanı ve değerlendirme sayısına göre sıralandı',
    inspectBtn: 'Bu Ürünü İncele →',

    // Shelf Tab
    myShelfTitle: 'Kozmetik Dolabım & Rutinim',
    shelfSub: 'MIRA yeni ürün baktığınızda buradaki ürünlerle çakışma ve tekrarları kontrol eder.',
    addProduct: 'Dolaba Yeni Ürün Ekle',
    productName: 'Ürün Adı',
    brand: 'Marka',
    notes: 'Deneyim Notları',
    rating: 'Puanınız (1-5)',
    saveToShelf: 'Dolaba Kaydet',
    emptyShelf: 'Henüz dolabınızda ürün yok. Yukarıdan ekleyin!',
    delete: 'Sil',

    // History Tab
    historyTitle: 'Araştırma Geçmişi',
    historySub: 'Daha önce analiz ettiğiniz ürünler ve aldığınız tavsiyeler.',
    emptyHistory: 'Henüz araştırma geçmişi bulunmuyor.',
    inspectAgain: 'Tekrar İncele →',

    // Settings Tab
    settingsTitle: 'Ayarlar & Tercihler',
    appearanceAndLang: 'Görünüm & Dil Tercihleri',
    themeMode: 'Görünüm Modu',
    themeLight: '☀️ Aydınlık (Light)',
    themeDark: '🌙 Karanlık (Dark)',
    language: 'Uygulama Dili',
    langTr: '🇹🇷 Türkçe',
    langEn: '🇬🇧 English',
    skinPrefsTitle: 'Cilt Özellikleri & Tercihler',
    skinType: 'Cilt Tipi',
    undertone: 'Alt Ton',
    concerns: 'Endişeler & Hassasiyetler',
    savePrefs: 'Tercihleri Kaydet',
    prefsSaved: 'Tercihleriniz başarıyla kaydedildi.',
    accountPrivacy: 'Hesap & KVKK Gizliliği',
    exportData: 'Kişisel Verilerimi İndir (JSON)',
    deleteAccount: 'Hesabımı Kalıcı Olarak Sil',
  },
  en: {
    // Header & Navigation
    appTitle: 'MIRA RESEARCH',
    tabSearch: 'Search',
    tabShelf: 'My Shelf',
    tabHistory: 'History',
    tabSettings: 'Settings',
    newSearch: '← New Search',
    profileTag: 'SKIN',

    // Auth & Onboarding
    authSubtitle: 'Intelligent Beauty & Shopping Research Assistant',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password',
    signIn: 'Sign In',
    quickDemo: 'Quick Demo Access (One-Tap)',
    createAccount: 'Create Account',
    onboardingTitle: 'Tell MIRA About Your Skin',
    onboardingSubtitle: 'Quick answers to calibrate personalized suitability scores.',
    startResearching: 'Start Researching',

    // Search Screen
    searchPrompt: 'What product would you like to investigate?',
    searchPlaceholder: 'Product name or paste link...',
    analyzeBtn: 'Analyze Product',
    searchMicroHint: 'MIRA checks reviews, Rosacea/Acne triggers, and shelf duplication.',
    analyzing: 'MIRA is analyzing for your skin...',

    // Product Report
    reportTitle: 'Product Analysis Report',
    match: 'MATCH',
    skinAnalysisTitle: 'PERSONAL SKIN ANALYSIS',
    shelfCheckTitle: 'SHELF & REALITY CHECK',
    clinicalCaution: 'Clinical & Dermatological Caution',
    addToShelf: '+ Add to My Shelf / Wishlist',
    addedToShelf: 'Product added to your shelf!',
    bottomSearchPlaceholder: 'Search another product or paste link...',
    searchBtn: 'Search',

    // Suggestions Screen
    productChoices: 'Product Choices',
    rankedSub: 'Ranked by highest user ratings and review count',
    inspectBtn: 'Inspect Product →',

    // Shelf Tab
    myShelfTitle: 'My Cosmetic Shelf & Routine',
    shelfSub: 'MIRA checks for duplication and conflicts against products here.',
    addProduct: 'Add Product to My Shelf',
    productName: 'Product Name',
    brand: 'Brand',
    notes: 'Experience Notes',
    rating: 'Your Rating (1-5)',
    saveToShelf: 'Save to Shelf',
    emptyShelf: 'No products in your shelf yet. Add one above!',
    delete: 'Delete',

    // History Tab
    historyTitle: 'Research History',
    historySub: 'Products you previously investigated and clinical verdicts.',
    emptyHistory: 'No research history yet.',
    inspectAgain: 'Inspect Again →',

    // Settings Tab
    settingsTitle: 'Settings & Preferences',
    appearanceAndLang: 'Appearance & Language',
    themeMode: 'Appearance Mode',
    themeLight: '☀️ Light Mode',
    themeDark: '🌙 Dark Mode',
    language: 'App Language',
    langTr: '🇹🇷 Turkish',
    langEn: '🇬🇧 English',
    skinPrefsTitle: 'Skin Attributes & Preferences',
    skinType: 'Skin Type',
    undertone: 'Skin Undertone',
    concerns: 'Concerns & Triggers',
    savePrefs: 'Save Preferences',
    prefsSaved: 'Profile preferences updated.',
    accountPrivacy: 'Account & GDPR / KVKK Privacy',
    exportData: 'Export Personal Data (JSON)',
    deleteAccount: 'Permanently Delete Account',
  }
};
