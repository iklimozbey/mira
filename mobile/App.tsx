import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { apiClient, STATIC_ASSETS_URL } from './src/api/client';
import { BEAUTY_IMAGES } from './src/assets/productImages';
import { ResearchReport, UserProfile, InventoryItem, QuotaInfo } from './src/types';
import { lightTheme, darkTheme, ThemeColors } from './src/theme/colors';
import { translations, Language } from './src/i18n/translations';
import { translateText } from './src/i18n/contentTranslator';

const getProductImage = (productName?: string, category?: string, imageUrl?: string): string => {
  const lower = ((productName || '') + ' ' + (category || '')).toLowerCase();
  if (lower.includes('mascara') || lower.includes('maskara') || lower.includes('rimel') || lower.includes('lash') || lower.includes('curl')) {
    return BEAUTY_IMAGES.mascara;
  }
  if (lower.includes('lip') || lower.includes('ruj') || lower.includes('gloss') || lower.includes('stain') || lower.includes('tattoo')) {
    return BEAUTY_IMAGES.lipstick;
  }
  if (lower.includes('foundation') || lower.includes('fondöten') || lower.includes('fit me') || lower.includes('coverage') || lower.includes('infallible')) {
    return BEAUTY_IMAGES.foundation;
  }
  if (lower.includes('serum') || lower.includes('niacinamide') || lower.includes('hyaluronic') || lower.includes('acid') || lower.includes('asit')) {
    return BEAUTY_IMAGES.serum;
  }
  if (lower.includes('sun') || lower.includes('güneş') || lower.includes('spf') || lower.includes('anthelios')) {
    return BEAUTY_IMAGES.sunscreen;
  }
  if (lower.includes('cream') || lower.includes('krem') || lower.includes('moisturizer') || lower.includes('cerave') || lower.includes('cicaplast')) {
    return BEAUTY_IMAGES.moisturizer;
  }
  return BEAUTY_IMAGES.foundation;
};

const ProductAvatar = ({
  productName,
  category,
  imageUrl,
  size = 54,
  theme,
}: {
  productName?: string;
  category?: string;
  imageUrl?: string;
  size?: number;
  theme: ThemeColors;
}) => {
  const uri = getProductImage(productName, category, imageUrl);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: theme.cardBgSecondary,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
};

const getVerdictColor = (verdict?: string) => {
  switch (verdict?.toUpperCase()) {
    case 'BUY':
      return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
    case 'SKIP':
      return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    case 'REDUNDANT':
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    default:
      return { bg: '#F8EEF2', text: '#C87D8A', border: '#FECDD3' };
  }
};

const getLocalizedSkinType = (skinType?: string, lang: Language = 'tr') => {
  const st = (skinType || '').toLowerCase();
  if (lang === 'tr') {
    if (st === 'dry') return 'KURU';
    if (st === 'oily') return 'YAĞLI';
    if (st === 'combination') return 'KARMA';
    if (st === 'sensitive') return 'HASSAS';
    if (st === 'normal') return 'NORMAL';
    return 'CİLT';
  } else {
    if (st === 'dry') return 'DRY';
    if (st === 'oily') return 'OILY';
    if (st === 'combination') return 'COMBINATION';
    if (st === 'sensitive') return 'SENSITIVE';
    if (st === 'normal') return 'NORMAL';
    return 'SKIN';
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'shelf' | 'history' | 'settings'>('search');

  // Appearance & Language state
  const [language, setLanguage] = useState<Language>('tr');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showSkinTypeModal, setShowSkinTypeModal] = useState<boolean>(false);

  const t = translations[language];
  const theme = isDarkMode ? darkTheme : lightTheme;

  // View state: 'search' | 'report_detail' | 'suggestions_list'
  const [currentScreen, setCurrentScreen] = useState<'search' | 'report_detail' | 'suggestions_list'>('search');
  const [beautySection, setBeautySection] = useState<'makeup' | 'skincare'>('makeup');

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('demo@mira.app');
  const [password, setPassword] = useState('mira1234');
  const [authError, setAuthError] = useState('');

  // Onboarding state
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    skin_type: 'combination',
    skin_undertone: 'warm',
    skin_concerns: ['rosacea', 'pores'],
    allergies_sensitivities: [],
    budget_level: 'medium',
  });

  const [quota, setQuota] = useState<QuotaInfo>({
    tier: 'free',
    daily_limit: 5,
    used_today: 0,
    remaining_today: 5,
  });

  const [profileSavedMsg, setProfileSavedMsg] = useState('');
  const [exportedDataJson, setExportedDataJson] = useState('');

  // Research state
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<ResearchReport | null>(null);
  const [history, setHistory] = useState<ResearchReport[]>([]);

  // Shelf state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdNotes, setNewProdNotes] = useState('');
  const [newProdRating, setNewProdRating] = useState('5');

  const refreshQuota = async () => {
    try {
      const q = await apiClient.getQuota();
      setQuota(q);
    } catch (err) {}
  };

  const handleAuth = async (isRegister: boolean, overrideEmail?: string, overridePass?: string, forceOnboarding?: boolean) => {
    const targetEmail = (overrideEmail || email || '').trim().toLowerCase();
    const targetPass = overridePass !== undefined ? overridePass : password;
    setAuthError('');
    try {
      if (isRegister) {
        await apiClient.register(targetEmail, targetPass);
      }
      await apiClient.login(targetEmail, targetPass);
      const userProf = await apiClient.getProfile();
      setProfile(userProf);
      await refreshQuota();
      setIsAuthenticated(true);

      if (forceOnboarding || isRegister || !userProf.skin_type || !userProf.skin_undertone) {
        setIsOnboardingCompleted(false);
      } else {
        setIsOnboardingCompleted(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    }
  };

  const finishOnboarding = async () => {
    try {
      const updated = await apiClient.updateProfile(profile);
      setProfile(updated);
      setIsOnboardingCompleted(true);
      setCurrentScreen('search');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await apiClient.updateProfile(profile);
      setProfile(updated);
      setProfileSavedMsg('Profile preferences updated.');
      setTimeout(() => setProfileSavedMsg(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await apiClient.exportMyData();
      setExportedDataJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiClient.deleteAccount();
      setIsAuthenticated(false);
      setIsOnboardingCompleted(false);
      setCurrentReport(null);
      setExportedDataJson('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAnalyze = async (specificQuery?: string) => {
    const targetQuery = specificQuery || query;
    if (!targetQuery || !targetQuery.trim()) {
      alert('Please enter a product name or link');
      return;
    }
    setLoading(true);
    try {
      const report = await apiClient.analyzeProduct(targetQuery);
      setCurrentReport(report);
      await refreshQuota();
      
      // Explicitly switch view depending on backend mode
      if (report && report.mode === 'suggestions') {
        setCurrentScreen('suggestions_list');
      } else {
        setCurrentScreen('report_detail');
      }
    } catch (err: any) {
      alert('Search Error: ' + (err.message || 'Failed to analyze product'));
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const list = await apiClient.getHistory();
      setHistory(list);
    } catch (err) {}
  };

  const loadInventory = async () => {
    try {
      const items = await apiClient.getInventory();
      setInventory(items);
    } catch (err) {}
  };

  const handleAddShelfItem = async () => {
    if (!newProdName.trim()) return;
    try {
      await apiClient.addInventoryItem({
        product_name: newProdName,
        brand: newProdBrand || undefined,
        rating: parseInt(newProdRating, 10) || 5,
        experience_notes: newProdNotes || undefined,
        status: 'tested',
      });
      setNewProdName('');
      setNewProdBrand('');
      setNewProdNotes('');
      loadInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteShelfItem = async (id: string) => {
    try {
      await apiClient.deleteInventoryItem(id);
      loadInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectSkinType = async (newType: string) => {
    setShowSkinTypeModal(false);
    const updated = { ...profile, skin_type: newType };
    setProfile(updated);
    try {
      await apiClient.updateProfile({ skin_type: newType });
    } catch (err) {}

    // Live recalibration of current product report if open
    if (currentReport && currentReport.product_name) {
      handleAnalyze(currentReport.product_name);
    }
  };

  const renderTopHeader = (title: string, showBack: boolean = false, onBack?: () => void) => (
    <View style={[styles.topHeader, { backgroundColor: theme.headerBg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{t.newSearch}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 10 }} />
        )}
      </View>

      <Text style={[styles.topHeaderTitle, { color: theme.headerText }]}>{title}</Text>

      {/* Header Actions: Language, Theme, Profile */}
      <View style={styles.headerActionsRow}>
        {/* Language Toggle Pill */}
        <TouchableOpacity
          style={[
            styles.headerIconPill,
            { backgroundColor: isDarkMode ? '#261C23' : '#33202C', borderWidth: 1, borderColor: theme.border },
          ]}
          onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
        >
          <Text style={[styles.headerIconPillText, { color: '#FAF5F8' }]}>{language.toUpperCase()}</Text>
        </TouchableOpacity>

        {/* Dark / Light Mode Toggle Pill */}
        <TouchableOpacity
          style={[
            styles.headerIconPill,
            { backgroundColor: isDarkMode ? '#261C23' : '#33202C', borderWidth: 1, borderColor: theme.border },
          ]}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <Text style={[styles.headerIconPillText, { color: '#FAF5F8' }]}>{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
        </TouchableOpacity>

        {/* Skin Quiz / Onboarding Trigger Button */}
        <TouchableOpacity
          style={[
            styles.skinProfileTagButton,
            { backgroundColor: theme.accent, marginRight: 4 },
          ]}
          onPress={() => setIsOnboardingCompleted(false)}
        >
          <Text style={[styles.skinProfileTagText, { color: '#FFFFFF', fontWeight: '800' }]}>
            {language === 'tr' ? 'TEST' : 'QUIZ'}
          </Text>
        </TouchableOpacity>

        {/* Interactive Skin Type Filter Button */}
        <TouchableOpacity
          style={[
            styles.skinProfileTagButton,
            { backgroundColor: isDarkMode ? '#261C23' : '#33202C', borderWidth: 1, borderColor: theme.border },
          ]}
          onPress={() => setShowSkinTypeModal(true)}
        >
          <Text style={[styles.skinProfileTagText, { color: '#FAF5F8' }]}>
            {getLocalizedSkinType(profile.skin_type, language)} ▼
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSkinTypeModal = () => (
    <Modal
      visible={showSkinTypeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSkinTypeModal(false)}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={() => setShowSkinTypeModal(false)}
      >
        <View
          style={[
            styles.skinModalBox,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.skinModalTitle, { color: theme.textPrimary }]}>
            {t.skinModalTitle}
          </Text>
          <Text style={[styles.skinModalSub, { color: theme.textSecondary }]}>
            {t.skinModalSub}
          </Text>

          <View style={styles.skinModalOptionsList}>
            {[
              { key: 'combination', code: 'COMBI', name: t.skinCombination, desc: t.skinCombinationDesc },
              { key: 'dry', code: 'DRY', name: t.skinDry, desc: t.skinDryDesc },
              { key: 'oily', code: 'OILY', name: t.skinOily, desc: t.skinOilyDesc },
              { key: 'sensitive', code: 'SENSITIVE', name: t.skinSensitive, desc: t.skinSensitiveDesc },
              { key: 'normal', code: 'NORMAL', name: t.skinNormal, desc: t.skinNormalDesc },
            ].map((opt) => {
              const isSelected = profile.skin_type === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.skinOptionCard,
                    { backgroundColor: isDarkMode ? theme.inputBg : '#FFFFFF', borderColor: theme.border },
                    isSelected && { backgroundColor: theme.cardBgSecondary, borderColor: theme.accent, borderWidth: 1.5 },
                  ]}
                  onPress={() => handleSelectSkinType(opt.key)}
                >
                  <View style={[styles.skinBadgePill, { backgroundColor: isSelected ? theme.accent : (isDarkMode ? '#27272A' : '#F4F4F5') }]}>
                    <Text style={[styles.skinBadgePillText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>{opt.code}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.skinOptionName,
                        { color: theme.textPrimary },
                        isSelected && { color: theme.accent, fontWeight: '800' },
                      ]}
                    >
                      {opt.name}
                    </Text>
                    <Text style={[styles.skinOptionDesc, { color: theme.textMuted }]}>
                      {opt.desc}
                    </Text>
                  </View>
                  {isSelected && <Text style={[styles.skinOptionCheck, { color: theme.accent }]}>[OK]</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.skinModalCloseBtn, { backgroundColor: theme.accent }]}
            onPress={() => setShowSkinTypeModal(false)}
          >
            <Text style={styles.skinModalCloseBtnText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // 1. Auth View (Modern Minimalist Card)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {/* Top Mini Bar for Theme & Language in Auth */}
        <View style={styles.authTopBar}>
          <TouchableOpacity
            style={[
              styles.headerIconPill,
              { backgroundColor: isDarkMode ? '#2B2228' : '#EFE5EA' },
            ]}
            onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
          >
            <Text style={[styles.headerIconPillText, { color: theme.accent }]}>
              {language.toUpperCase()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerIconPill,
              { backgroundColor: isDarkMode ? '#2B2228' : '#EFE5EA' },
            ]}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Text style={styles.headerIconPillText}>{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <View style={[styles.modernAuthCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.heroLogo, { color: theme.accent }]}>MIRA</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>{t.authSubtitle}</Text>

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              placeholder={t.emailPlaceholder}
              placeholderTextColor={isDarkMode ? '#7A6B74' : '#B0A6AD'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              placeholder={t.passwordPlaceholder}
              placeholderTextColor={isDarkMode ? '#7A6B74' : '#B0A6AD'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: theme.accent }]}
              onPress={() => handleAuth(false)}
            >
              <Text style={styles.mainActionBtnText}>{t.signIn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: '#000000', borderWidth: 1.5, borderColor: theme.accent, marginTop: 10 }]}
              onPress={() => {
                setEmail('demo@mira.app');
                setPassword('mira1234');
                handleAuth(false, 'demo@mira.app', 'mira1234');
              }}
            >
              <Text style={[styles.mainActionBtnText, { color: theme.accent }]}>{t.quickDemo}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textOnlyBtn} onPress={() => handleAuth(true)}>
              <Text style={[styles.textOnlyBtnText, { color: theme.accent }]}>{t.createAccount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.textOnlyBtn,
                {
                  marginTop: 6,
                  paddingVertical: 9,
                  backgroundColor: isDarkMode ? '#2A2027' : '#FDF2F5',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handleAuth(false, undefined, undefined, true)}
            >
              <Text style={[styles.textOnlyBtnText, { color: theme.accent, fontWeight: '700' }]}>
                {language === 'tr' ? 'CİLT TESTİNİ BAŞLAT' : 'START SKIN QUIZ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Onboarding Skin Profile Modal / Form
  if (!isOnboardingCompleted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ScrollView contentContainerStyle={styles.centerContainer}>
          <View style={[styles.onboardingCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>{t.onboardingTitle}</Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>{t.onboardingSubtitle}</Text>

            {/* Skin Type */}
            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.skinType}</Text>
            <View style={styles.gridRow}>
              {['combination', 'oily', 'dry', 'sensitive'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.chipButton,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                    profile.skin_type === st && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}
                  onPress={() => setProfile({ ...profile, skin_type: st })}
                >
                  <Text
                    style={[
                      styles.chipButtonText,
                      { color: theme.textPrimary },
                      profile.skin_type === st && { color: '#FFF', fontWeight: '800' },
                    ]}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Undertone */}
            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.undertone}</Text>
            <View style={styles.gridRow}>
              {['warm', 'cool', 'neutral'].map((ut) => (
                <TouchableOpacity
                  key={ut}
                  style={[
                    styles.chipButton,
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                    profile.skin_undertone === ut && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}
                  onPress={() => setProfile({ ...profile, skin_undertone: ut })}
                >
                  <Text
                    style={[
                      styles.chipButtonText,
                      { color: theme.textPrimary },
                      profile.skin_undertone === ut && { color: '#FFF', fontWeight: '800' },
                    ]}
                  >
                    {ut.charAt(0).toUpperCase() + ut.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Concerns */}
            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.concerns}</Text>
            <View style={styles.gridRow}>
              {[
                { key: 'rosacea', label: 'Rosacea / Redness' },
                { key: 'acne', label: 'Acne-Prone' },
                { key: 'fungal_acne', label: 'Fungal Acne' },
                { key: 'pores', label: 'Pores' },
                { key: 'eczema', label: 'Eczema' },
              ].map((c) => {
                const active = (profile.skin_concerns || []).includes(c.key);
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.chipButton,
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      active && { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                    onPress={() => {
                      const cur = profile.skin_concerns || [];
                      const updated = active ? cur.filter((i) => i !== c.key) : [...cur, c.key];
                      setProfile({ ...profile, skin_concerns: updated });
                    }}
                  >
                    <Text
                      style={[
                        styles.chipButtonText,
                        { color: theme.textPrimary },
                        active && { color: '#FFF', fontWeight: '800' },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: theme.accent, marginTop: 20 }]}
              onPress={finishOnboarding}
            >
              <Text style={styles.mainActionBtnText}>{t.startResearching}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {renderSkinTypeModal()}
      </SafeAreaView>
    );
  }

  // 3. Suggestions List Screen (when user types general queries like 'maybelline ruj')
  if (currentScreen === 'suggestions_list' && currentReport?.suggested_products) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" />
        {renderTopHeader(t.productChoices, true, () => setCurrentScreen('search'))}

        <ScrollView contentContainerStyle={styles.suggestionsScrollContent}>
          <View style={styles.disambiguationCard}>
            <Text style={[styles.disambiguationHeader, { color: theme.textPrimary }]}>
              {currentReport.disambiguation_message}
            </Text>
            <Text style={[styles.disambiguationSub, { color: theme.accent }]}>{t.rankedSub}</Text>
          </View>

          {currentReport.suggested_products.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.compactProductBox,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              {/* Header: Product Photo + Product Name + Star Rating */}
              <View style={styles.compactBoxHeader}>
                <ProductAvatar
                  productName={item.product_name}
                  category={item.category}
                  imageUrl={item.image_url}
                  size={54}
                  theme={theme}
                />
                <View style={styles.compactTitleArea}>
                  <View style={styles.compactRowBetween}>
                    <Text
                      style={[
                        styles.compactRankText,
                        { backgroundColor: theme.cardBgSecondary, color: theme.accent },
                      ]}
                    >
                      #{idx + 1}
                    </Text>
                    <View style={styles.starRatingBadge}>
                      <Text style={styles.starRatingText}>★ {item.rating}</Text>
                      <Text style={[styles.starReviewCount, { color: theme.textMuted }]}>
                        ({item.review_count.toLocaleString()})
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.compactProductName, { color: theme.textPrimary }]}>
                    {item.product_name}
                  </Text>
                  {item.badge ? (
                    <View style={[styles.compactBadgePill, { backgroundColor: theme.cardBgSecondary }]}>
                      <Text style={[styles.compactBadgeText, { color: theme.accent }]}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Bold Green Pro (+) and Bold Red Con (-) Only */}
              <View style={styles.compactFeaturesContainer}>
                {item.key_pro ? (
                  <View
                    style={[
                      styles.featureRowPro,
                      { backgroundColor: theme.proBg, borderColor: theme.proBorder },
                    ]}
                  >
                    <Text style={styles.featureIconPro}>[+]</Text>
                    <Text style={[styles.featureTextPro, { color: theme.proText }]}>{item.key_pro}</Text>
                  </View>
                ) : null}

                {item.key_con ? (
                  <View
                    style={[
                      styles.featureRowCon,
                      { backgroundColor: theme.conBg, borderColor: theme.conBorder },
                    ]}
                  >
                    <Text style={styles.featureIconCon}>[−]</Text>
                    <Text style={[styles.featureTextCon, { color: theme.conText }]}>{item.key_con}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.inspectBtnCompact, { backgroundColor: theme.accent }]}
                onPress={() => {
                  setQuery(item.product_name);
                  handleAnalyze(item.product_name);
                }}
              >
                <Text style={styles.inspectBtnTextCompact}>{t.inspectBtn}</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Persistent Search Bar Directly Below Suggestions */}
          <View style={styles.bottomSearchContainer}>
            <View
              style={[
                styles.bottomSearchInputWrap,
                { backgroundColor: theme.cardBg, borderColor: theme.inputBorder },
              ]}
            >
              <TextInput
                style={[styles.bottomSearchInput, { color: theme.inputText }]}
                placeholder={t.bottomSearchPlaceholder}
                placeholderTextColor={isDarkMode ? '#7A6B74' : '#A89EAA'}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleAnalyze()}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearInputBtn}>
                  <Text style={styles.clearInputBtnText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.bottomSearchBtn,
                { backgroundColor: theme.accent },
                loading && { opacity: 0.7 },
              ]}
              onPress={() => handleAnalyze()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.bottomSearchBtnText}>{t.searchBtn}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        {renderSkinTypeModal()}
      </SafeAreaView>
    );
  }

  // 4. Centered Single-Box Product Report Screen with Bottom Search Bar
  if (currentScreen === 'report_detail' && currentReport) {
    const verdictStyle = getVerdictColor(currentReport.reality_check_verdict);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" />
        {renderTopHeader(t.reportTitle, true, () => {
          setCurrentReport(null);
          setCurrentScreen('search');
        })}

        <ScrollView contentContainerStyle={styles.unifiedScrollContent}>
          {/* Centered Single Product Box */}
          <View
            style={[
              styles.unifiedProductBox,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            {/* Real-time Loading Overlay inside the box */}
            {loading && (
              <View
                style={[
                  styles.boxLoadingOverlay,
                  {
                    backgroundColor: isDarkMode
                      ? 'rgba(30, 25, 28, 0.92)'
                      : 'rgba(255, 255, 255, 0.92)',
                  },
                ]}
              >
                <ActivityIndicator color={theme.accent} size="large" />
                <Text style={[styles.boxLoadingText, { color: theme.accent }]}>{t.analyzing}</Text>
              </View>
            )}

            {/* Header: Product Photo + Product Name + Match Score Badge */}
            <View style={styles.boxHeaderRow}>
              <View style={styles.boxIconAndTitle}>
                <ProductAvatar
                  productName={currentReport.product_name}
                  size={58}
                  theme={theme}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.boxProductName, { color: theme.textPrimary }]}>
                    {currentReport.product_name}
                  </Text>
                  {currentReport.reality_check_verdict ? (
                    <View
                      style={[
                        styles.boxVerdictBadge,
                        { backgroundColor: verdictStyle.bg, borderColor: verdictStyle.border },
                      ]}
                    >
                      <Text style={[styles.boxVerdictText, { color: verdictStyle.text }]}>
                        {currentReport.reality_check_verdict}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {currentReport.suitability_score !== undefined &&
                currentReport.suitability_score !== null && (
                  <View
                    style={[
                      styles.boxScoreBadge,
                      { backgroundColor: theme.cardBgSecondary, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.boxScoreNumber, { color: theme.accent }]}>
                      {currentReport.suitability_score}%
                    </Text>
                    <Text style={[styles.boxScoreLabel, { color: theme.textMuted }]}>{t.match}</Text>
                  </View>
                )}
            </View>

            {/* Summary */}
            {currentReport.summary ? (
              <Text style={[styles.boxSummaryText, { color: theme.textSecondary }]}>
                {translateText(currentReport.summary, language)}
              </Text>
            ) : null}

            {/* Laya Decision Engine & Guardrails Badge */}
            {currentReport.decision_engine ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDarkMode ? '#17202A' : '#F0F9FF',
                  borderRadius: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#1F3A52' : '#BAE6FD',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ backgroundColor: '#0284C7', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 9, fontWeight: '900', color: '#FFF' }}>CPU</Text></View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#38BDF8' : '#0284C7' }}>
                    {language === 'tr' ? 'Laya Karar Motoru (CPU)' : 'Laya Decision Engine (CPU)'}
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.textMuted }}>
                    ({currentReport.decision_engine.latency_ms} ms)
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: currentReport.decision_engine.guardrails_passed
                      ? (isDarkMode ? '#064E3B' : '#DCFCE7')
                      : (isDarkMode ? '#7F1D1D' : '#FEE2E2'),
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: currentReport.decision_engine.guardrails_passed ? '#10B981' : '#EF4444',
                    }}
                  >
                    {currentReport.decision_engine.guardrails_passed
                      ? (language === 'tr' ? 'KLİNİK: ONAYLI' : 'GUARDRAIL: PASS')
                      : (language === 'tr' ? 'KLİNİK: VETO' : 'GUARDRAIL: VETO')}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={[styles.boxDivider, { backgroundColor: theme.divider }]} />

            {/* Skin Fit Analysis */}
            {currentReport.suitability_reason ? (
              <View
                style={[
                  styles.boxSectionRow,
                  {
                    backgroundColor: isDarkMode ? theme.cardBgSecondary : '#FAF7F9',
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.boxSectionLabel, { color: theme.accent }]}>
                  {t.skinAnalysisTitle}
                </Text>
                <Text style={[styles.boxSectionBody, { color: theme.textPrimary }]}>
                  {translateText(currentReport.suitability_reason, language)}
                </Text>
              </View>
            ) : null}

            {/* Shelf & Reality Check */}
            {currentReport.reality_check_reason ? (
              <View
                style={[
                  styles.boxSectionRow,
                  {
                    backgroundColor: isDarkMode ? theme.cardBgSecondary : '#FAF7F9',
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.boxSectionLabel, { color: theme.accent }]}>
                  {t.shelfCheckTitle}
                </Text>
                <Text style={[styles.boxSectionBody, { color: theme.textPrimary }]}>
                  {translateText(currentReport.reality_check_reason, language)}
                </Text>
              </View>
            ) : null}

            {/* Clinical Caution (Rosacea / Acne) */}
            {currentReport.clinical_warnings && currentReport.clinical_warnings.length > 0 ? (
              <View
                style={[
                  styles.boxWarningRow,
                  { backgroundColor: theme.warningBg, borderColor: theme.warningBorder },
                ]}
              >
                <View style={{ backgroundColor: '#D97706', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginRight: 8, marginTop: 1 }}><Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>CAUTION</Text></View>
                <View style={{ flex: 1 }}>
                  {currentReport.clinical_warnings.map((w, idx) => (
                    <Text key={idx} style={[styles.boxWarningText, { color: theme.warningText }]}>
                      {translateText(w, language)}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Key Benefits (+) and Complaints (-) */}
            <View style={styles.boxProsConsContainer}>
              {currentReport.pros && currentReport.pros.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {currentReport.pros.slice(0, 3).map((p, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.featureRowPro,
                        { backgroundColor: theme.proBg, borderColor: theme.proBorder },
                      ]}
                    >
                      <Text style={styles.featureIconPro}>[+]</Text>
                      <Text style={[styles.featureTextPro, { color: theme.proText }]}>
                        {translateText(p, language)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {currentReport.cons && currentReport.cons.length > 0 ? (
                <View style={{ gap: 6, marginTop: 4 }}>
                  {currentReport.cons.slice(0, 2).map((c, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.featureRowCon,
                        { backgroundColor: theme.conBg, borderColor: theme.conBorder },
                      ]}
                    >
                      <Text style={styles.featureIconCon}>[−]</Text>
                      <Text style={[styles.featureTextCon, { color: theme.conText }]}>
                        {translateText(c, language)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Quick Add to Shelf Action */}
            <TouchableOpacity
              style={[
                styles.boxAddToShelfBtn,
                { backgroundColor: theme.cardBgSecondary, borderColor: theme.border },
              ]}
              onPress={() => {
                if (currentReport.product_name) {
                  apiClient
                    .addInventoryItem({
                      product_name: currentReport.product_name,
                      category: 'skincare',
                      status: 'wishlist',
                    })
                    .then(() => alert(t.addedToShelf))
                    .catch((e) => alert(e.message));
                }
              }}
            >
              <Text style={[styles.boxAddToShelfBtnText, { color: theme.accent }]}>
                {t.addToShelf}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Persistent Search Bar Directly Below the Box */}
          <View style={styles.bottomSearchContainer}>
            <View
              style={[
                styles.bottomSearchInputWrap,
                { backgroundColor: theme.cardBg, borderColor: theme.inputBorder },
              ]}
            >
              <TextInput
                style={[styles.bottomSearchInput, { color: theme.inputText }]}
                placeholder={t.bottomSearchPlaceholder}
                placeholderTextColor={isDarkMode ? '#7A6B74' : '#A89EAA'}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleAnalyze()}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearInputBtn}>
                  <Text style={styles.clearInputBtnText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.bottomSearchBtn,
                { backgroundColor: theme.accent },
                loading && { opacity: 0.7 },
              ]}
              onPress={() => handleAnalyze()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.bottomSearchBtnText}>{t.searchBtn}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        {renderSkinTypeModal()}
      </SafeAreaView>
    );
  }
  // 5. Main Tabbed Layout
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Unified Rose/Dark Header */}
      {renderTopHeader(
        activeTab === 'search'
          ? t.appTitle
          : activeTab === 'shelf'
          ? t.tabShelf
          : activeTab === 'history'
          ? t.tabHistory
          : t.tabSettings,
        false
      )}

      {/* Main Tab Content: Dashboard-Style Beauty Intelligence Hub */}
      {activeTab === 'search' && (
        <ScrollView contentContainerStyle={styles.dashboardScrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Dashboard Welcome & Profile Banner */}
          <View style={[styles.dashboardBanner, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dashboardGreeting, { color: theme.textSecondary }]}>
                {language === 'tr' ? 'MIRA AI Güzellik Asistanı' : 'MIRA AI Beauty Assistant'}
              </Text>
              <Text style={[styles.dashboardProfileTitle, { color: theme.textPrimary }]}>
                {getLocalizedSkinType(profile.skin_type, language)} {language === 'tr' ? 'Cilt Profili' : 'Skin Profile'}
              </Text>
              <Text style={[styles.dashboardProfileSub, { color: theme.textMuted }]}>
                {profile.skin_concerns && profile.skin_concerns.length > 0
                  ? profile.skin_concerns.map((c) => c.toUpperCase()).join(' • ')
                  : (language === 'tr' ? 'Hassasiyet tanımlı değil' : 'No sensitivities')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dashboardQuizBtn, { backgroundColor: theme.accent }]}
              onPress={() => setIsOnboardingCompleted(false)}
            >
              <Text style={styles.dashboardQuizBtnText}>{language === 'tr' ? 'TESTİ AÇ' : 'QUIZ'}</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Key Metrics Trio (Laya Karar Motoru, Guardrail Güvenliği, Dolap) */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.metricTagBadge, { backgroundColor: isDarkMode ? '#0C2A44' : '#E0F2FE' }]}>
                <Text style={{ color: '#0284C7', fontSize: 10, fontWeight: '900' }}>CPU</Text>
              </View>
              <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                {language === 'tr' ? 'Laya Motoru' : 'Laya Engine'}
              </Text>
              <Text style={[styles.metricValue, { color: '#0284C7' }]}>
                {language === 'tr' ? 'Sistem 1 (30ms)' : 'System 1 (30ms)'}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.metricTagBadge, { backgroundColor: isDarkMode ? '#052E16' : '#DCFCE7' }]}>
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '900' }}>SAFE</Text>
              </View>
              <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                {language === 'tr' ? 'Guardrails' : 'Guardrails'}
              </Text>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>
                {language === 'tr' ? 'Klinik Güvenli' : 'Clinical Safe'}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.metricTagBadge, { backgroundColor: isDarkMode ? '#2A141D' : '#F8EEF2' }]}>
                <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900' }}>BAG</Text>
              </View>
              <Text style={[styles.metricTitle, { color: theme.textPrimary }]}>
                {language === 'tr' ? 'Dolabım' : 'My Shelf'}
              </Text>
              <Text style={[styles.metricValue, { color: theme.accent }]}>
                {inventory.length} {language === 'tr' ? 'Ürün' : 'Items'}
              </Text>
            </View>
          </View>

          {/* 3. Dashboard Elevated Search Card */}
          <View style={[styles.dashboardSearchCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.dashboardSearchTitle, { color: theme.textPrimary }]}>
              {language === 'tr' ? 'Ürün veya Marka Analizi' : 'Product & Brand Analysis'}
            </Text>
            <View
              style={[
                styles.dashboardInputWrap,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
              ]}
            >
              <TextInput
                style={[styles.dashboardInput, { color: theme.inputText }]}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={isDarkMode ? '#7A6B74' : '#A89EAA'}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleAnalyze()}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearInputBtn}>
                  <Text style={styles.clearInputBtnText}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.dashboardActionBtn,
                { backgroundColor: theme.accent },
                loading && { opacity: 0.7 },
              ]}
              onPress={() => handleAnalyze()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.dashboardActionBtnText}>{t.analyzeBtn}</Text>
              )}
            </TouchableOpacity>

            {/* Trending Quick Search Chips */}
            <View style={styles.trendingChipsWrap}>
              <Text style={[styles.trendingLabel, { color: theme.textMuted }]}>
                {t.trendingBrands}:
              </Text>
              {(beautySection === 'makeup'
                ? ['Flormar', 'Maybelline', 'MAC', 'NARS', 'Fenty Beauty', 'Golden Rose', 'Kiko']
                : ['The Ordinary', 'CeraVe', 'La Roche-Posay', 'Bioderma', 'Bionnex', 'Cosrx']
              ).map((brandTag) => (
                <TouchableOpacity
                  key={brandTag}
                  style={[styles.trendingChip, { backgroundColor: theme.cardBgSecondary, borderColor: theme.border }]}
                  onPress={() => {
                    setQuery(brandTag);
                    handleAnalyze(brandTag);
                  }}
                >
                  <Text style={[styles.trendingChipText, { color: theme.accent }]}>{brandTag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 4. Segmented Control: MAKYAJ vs CİLT BAKIMI */}
          <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? '#221920' : '#F5EAEF', borderColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                beautySection === 'makeup' && [
                  styles.segmentButtonActive,
                  { backgroundColor: theme.accent, borderColor: theme.accent },
                ],
              ]}
              onPress={() => setBeautySection('makeup')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  { color: beautySection === 'makeup' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {t.makeupTab}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                beautySection === 'skincare' && [
                  styles.segmentButtonActive,
                  { backgroundColor: theme.accent, borderColor: theme.accent },
                ],
              ]}
              onPress={() => setBeautySection('skincare')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  { color: beautySection === 'skincare' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {t.skincareTab}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Distinct Category Tiles for Selected Beauty Section */}
          <View style={styles.categorySection}>
            <View style={styles.categorySectionHeader}>
              <Text style={[styles.categorySectionTitle, { color: theme.textPrimary }]}>
                {beautySection === 'makeup' ? t.makeupSectionTitle : t.skincareSectionTitle}
              </Text>
              <Text style={[styles.categorySectionSubtitle, { color: theme.textMuted }]}>
                {beautySection === 'makeup' ? t.makeupSubtitle : t.skincareSubtitle}
              </Text>
            </View>

            <View style={styles.categoryGrid}>
              {(beautySection === 'makeup'
                ? [
                    { name: language === 'tr' ? 'RUJ & DUDAK' : 'LIPSTICK & LIPS', query: 'ruj', img: BEAUTY_IMAGES.lipstick },
                    { name: language === 'tr' ? 'MASKARA & GÖZ' : 'MASCARA & EYES', query: 'maskara', img: BEAUTY_IMAGES.mascara },
                    { name: language === 'tr' ? 'FONDÖTEN & TEN' : 'FOUNDATION & BASE', query: 'fondöten', img: BEAUTY_IMAGES.foundation },
                  ]
                : [
                    { name: language === 'tr' ? 'SERUMLAR' : 'SERUMS', query: 'serum', img: BEAUTY_IMAGES.serum },
                    { name: language === 'tr' ? 'NEMLENDİRİCİ' : 'MOISTURIZERS', query: 'nemlendirici', img: BEAUTY_IMAGES.moisturizer },
                    { name: language === 'tr' ? 'GÜNEŞ KREMİ' : 'SUNSCREEN & SPF', query: 'güneş kremi', img: BEAUTY_IMAGES.sunscreen },
                  ]
              ).map((cat) => (
                <TouchableOpacity
                  key={cat.query}
                  style={[styles.categoryTile, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setQuery(cat.query);
                    handleAnalyze(cat.query);
                  }}
                >
                  <Image source={{ uri: cat.img }} style={styles.categoryTileImage} resizeMode="cover" />
                  <View style={[styles.categoryTileOverlay, { borderTopColor: theme.accent }]}>
                    <Text style={styles.categoryTileName}>{cat.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'shelf' && (
        <ScrollView contentContainerStyle={styles.tabScrollContent}>
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.detailCardHeader, { color: theme.textPrimary }]}>{t.addProduct}</Text>
            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              placeholder={`${t.productName} (e.g. NARS Light Reflecting)`}
              placeholderTextColor={isDarkMode ? '#7A6B74' : '#A098A3'}
              value={newProdName}
              onChangeText={setNewProdName}
            />
            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              placeholder={t.brand}
              placeholderTextColor={isDarkMode ? '#7A6B74' : '#A098A3'}
              value={newProdBrand}
              onChangeText={setNewProdBrand}
            />
            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              placeholder={t.notes}
              placeholderTextColor={isDarkMode ? '#7A6B74' : '#A098A3'}
              value={newProdNotes}
              onChangeText={setNewProdNotes}
            />
            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: theme.accent }]}
              onPress={handleAddShelfItem}
            >
              <Text style={styles.mainActionBtnText}>{t.saveToShelf}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 14 }}>
            {inventory.length === 0 ? (
              <Text style={{ textAlign: 'center', color: theme.textMuted, marginTop: 20 }}>
                {t.emptyShelf}
              </Text>
            ) : (
              inventory.map((item) => (
                <View
                  key={item.id}
                  style={[styles.shelfCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.shelfCardTitle, { color: theme.textPrimary }]}>
                      {item.product_name}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteShelfItem(item.id)}>
                      <Text style={styles.deleteLinkText}>{t.delete}</Text>
                    </TouchableOpacity>
                  </View>
                  {item.experience_notes ? (
                    <Text style={[styles.shelfCardNotes, { color: theme.textSecondary }]}>
                      "{item.experience_notes}"
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'history' && (
        <ScrollView contentContainerStyle={styles.tabScrollContent}>
          {history.length === 0 ? (
            <Text style={{ textAlign: 'center', color: theme.textMuted, marginTop: 40 }}>
              {t.emptyHistory}
            </Text>
          ) : (
            history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.shelfCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => {
                  setCurrentReport(item);
                  setCurrentScreen('report_detail');
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.shelfCardTitle, { color: theme.textPrimary }]}>
                    {item.product_name}
                  </Text>
                  <View
                    style={[
                      styles.historyMatchBadge,
                      { backgroundColor: theme.cardBgSecondary },
                    ]}
                  >
                    <Text style={[styles.historyMatchBadgeText, { color: theme.accent }]}>
                      {item.suitability_score}%
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={[styles.shelfCardNotes, { color: theme.textSecondary }]}>
                  {item.summary}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'settings' && (
        <ScrollView contentContainerStyle={styles.tabScrollContent}>
          {/* 1. Appearance & Language Card */}
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.detailCardHeader, { color: theme.textPrimary }]}>
              {t.appearanceAndLang}
            </Text>

            {/* Theme Toggle Buttons */}
            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.themeMode}</Text>
            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  !isDarkMode && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
                onPress={() => setIsDarkMode(false)}
              >
                <Text
                  style={[
                    styles.chipButtonText,
                    { color: theme.textPrimary },
                    !isDarkMode && { color: '#FFF', fontWeight: '800' },
                  ]}
                >
                  {t.themeLight}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  isDarkMode && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
                onPress={() => setIsDarkMode(true)}
              >
                <Text
                  style={[
                    styles.chipButtonText,
                    { color: theme.textPrimary },
                    isDarkMode && { color: '#FFF', fontWeight: '800' },
                  ]}
                >
                  {t.themeDark}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Language Toggle Buttons */}
            <Text style={[styles.formSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              {t.language}
            </Text>
            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  language === 'tr' && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
                onPress={() => setLanguage('tr')}
              >
                <Text
                  style={[
                    styles.chipButtonText,
                    { color: theme.textPrimary },
                    language === 'tr' && { color: '#FFF', fontWeight: '800' },
                  ]}
                >
                  {t.langTr}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chipButton,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                  language === 'en' && { backgroundColor: theme.accent, borderColor: theme.accent },
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.chipButtonText,
                    { color: theme.textPrimary },
                    language === 'en' && { color: '#FFF', fontWeight: '800' },
                  ]}
                >
                  {t.langEn}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Skin Attributes & Preferences */}
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 14 }]}>
            <Text style={[styles.detailCardHeader, { color: theme.textPrimary }]}>
              {t.skinPrefsTitle}
            </Text>

            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.skinType}</Text>
            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              value={profile.skin_type}
              onChangeText={(v) => setProfile({ ...profile, skin_type: v })}
            />

            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.undertone}</Text>
            <TextInput
              style={[
                styles.heroInput,
                { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.inputText },
              ]}
              value={profile.skin_undertone}
              onChangeText={(v) => setProfile({ ...profile, skin_undertone: v })}
            />

            <Text style={[styles.formSectionLabel, { color: theme.textSecondary }]}>{t.concerns}</Text>
            <View style={styles.gridRow}>
              {['rosacea', 'acne', 'fungal_acne', 'redness', 'pores', 'eczema'].map((c) => {
                const active = (profile.skin_concerns || []).includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chipButton,
                      { backgroundColor: theme.inputBg, borderColor: theme.border },
                      active && { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                    onPress={() => {
                      const cur = profile.skin_concerns || [];
                      const updated = active ? cur.filter((i) => i !== c) : [...cur, c];
                      setProfile({ ...profile, skin_concerns: updated });
                    }}
                  >
                    <Text
                      style={[
                        styles.chipButtonText,
                        { color: theme.textPrimary },
                        active && { color: '#FFF', fontWeight: '800' },
                      ]}
                    >
                      {c === 'rosacea' ? 'Rosacea' : c === 'acne' ? 'Acne-Prone' : c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {profileSavedMsg ? <Text style={styles.successText}>{profileSavedMsg}</Text> : null}

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: theme.accent }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.mainActionBtnText}>{t.savePrefs}</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Account & Privacy */}
          <View style={[styles.detailCard, { backgroundColor: theme.cardBg, borderColor: theme.border, marginTop: 14 }]}>
            <Text style={[styles.detailCardHeader, { color: theme.textPrimary }]}>
              {t.accountPrivacy}
            </Text>

            <TouchableOpacity
              style={[styles.outlineActionBtn, { borderColor: theme.accent }]}
              onPress={handleExportData}
            >
              <Text style={[styles.outlineActionBtnText, { color: theme.accent }]}>
                {t.exportData}
              </Text>
            </TouchableOpacity>

            {exportedDataJson ? (
              <View style={[styles.jsonPreviewBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.jsonPreviewText, { color: theme.textPrimary }]}>{exportedDataJson}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.outlineActionBtn, { borderColor: '#E57373', marginTop: 10 }]}
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.outlineActionBtnText, { color: '#D32F2F' }]}>
                {t.deleteAccount}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Clean Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomNavBar,
          { backgroundColor: theme.navBarBg, borderColor: theme.navBarBorder },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('search');
            setCurrentScreen('search');
          }}
        >
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'search' ? theme.navTextActive : theme.navText },
            ]}
          >
            {t.tabSearch}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('shelf');
            loadInventory();
          }}
        >
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'shelf' ? theme.navTextActive : theme.navText },
            ]}
          >
            {t.tabShelf}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'history' ? theme.navTextActive : theme.navText },
            ]}
          >
            {t.tabHistory}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('settings')}>
          <Text
            style={[
              styles.navText,
              { color: activeTab === 'settings' ? theme.navTextActive : theme.navText },
            ]}
          >
            {t.tabSettings}
          </Text>
        </TouchableOpacity>
      </View>
      {renderSkinTypeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  authTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  // Top Sephora Noir Black Header
  topHeader: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skinProfileTag: {
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skinProfileTagButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skinModalBox: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  skinModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  skinModalSub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  skinModalOptionsList: {
    gap: 8,
    marginBottom: 16,
  },
  skinOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  skinBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  skinBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skinOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  skinOptionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  skinOptionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  skinOptionCheck: {
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
  },
  skinModalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  skinModalCloseBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  skinProfileTagText: { color: '#FFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  backButton: { paddingVertical: 4, paddingHorizontal: 8 },
  backButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Centered Search Screen (Clean Perplexity-Style)
  centerSearchLayout: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  searchHeroBox: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  searchPromptBig: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A0A0A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  bigSearchInputContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 16,
  },
  bigSearchInput: {
    fontSize: 15,
    color: '#0A0A0A',
  },
  bigSearchActionBtn: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#C87D8A',
  },
  bigSearchActionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  searchMicroHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },

  // Unified Centered Single-Box Product Report Styles
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  detailCardHeader: { fontSize: 15, fontWeight: '800', color: '#0A0A0A', marginBottom: 10, letterSpacing: 0.5 },
  unifiedScrollContent: { padding: 16, alignItems: 'center', paddingBottom: 60, width: '100%' },
  unifiedProductBox: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 14,
    position: 'relative',
  },
  boxLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  boxLoadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#C87D8A',
  },
  boxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  boxIconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  boxCategoryBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  boxCategoryEmoji: {
    fontSize: 20,
  },
  boxProductName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
    lineHeight: 22,
  },
  boxVerdictBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  boxVerdictText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  boxScoreBadge: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C87D8A',
  },
  boxScoreNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C87D8A',
  },
  boxScoreLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  boxSummaryText: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 10,
  },
  boxDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  boxSectionRow: {
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  boxSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C87D8A',
    marginBottom: 3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  boxSectionBody: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
    fontWeight: '500',
  },
  boxWarningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  boxWarningIcon: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 1,
  },
  boxWarningText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 17,
  },
  boxProsConsContainer: {
    marginTop: 2,
    marginBottom: 12,
  },
  boxAddToShelfBtn: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#C87D8A',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  boxAddToShelfBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Persistent Bottom Search Bar
  bottomSearchContainer: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  bottomSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  bottomSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0A0A0A',
  },
  clearInputBtn: {
    padding: 4,
  },
  clearInputBtnText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSearchBtn: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 18,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C87D8A',
  },
  bottomSearchBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Onboarding Form Card (Compact Popup Style)
  onboardingCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: '#0A0A0A', textAlign: 'center', letterSpacing: 0.5 },
  formSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  formSectionLabel: { fontSize: 11, fontWeight: '800', color: '#4B5563', textTransform: 'uppercase', marginBottom: 8, marginTop: 10, letterSpacing: 0.8 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chipButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#C87D8A',
  },
  chipButtonText: { fontSize: 12.5, color: '#4B5563', fontWeight: '600' },
  chipButtonTextActive: { color: '#C87D8A', fontWeight: '800' },

  // Auth Card
  modernAuthCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  heroLogo: { fontSize: 34, fontWeight: '900', color: '#000000', textAlign: 'center', letterSpacing: 4 },
  heroSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  heroInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#0A0A0A',
    marginBottom: 12,
  },
  mainActionBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  mainActionBtnText: { color: '#FFF', fontSize: 13.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  textOnlyBtn: { marginTop: 14, alignItems: 'center' },
  textOnlyBtnText: { color: '#C87D8A', fontSize: 12.5, fontWeight: '700', letterSpacing: 0.5 },

  // Suggestions List Styles (Compact Centered Box Layout)
  suggestionsScrollContent: { padding: 16, alignItems: 'center', paddingBottom: 60 },
  disambiguationCard: { width: '100%', maxWidth: 440, marginBottom: 16, alignItems: 'center' },
  disambiguationHeader: { fontSize: 18, fontWeight: '800', color: '#0A0A0A', textAlign: 'center', lineHeight: 24 },
  disambiguationSub: { fontSize: 12, color: '#C87D8A', marginTop: 4, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 },
  compactProductBox: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  compactBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  productIconEmoji: {
    fontSize: 20,
  },
  compactTitleArea: {
    flex: 1,
  },
  compactRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  compactRankText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#C87D8A',
    backgroundColor: '#F8EEF2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  starRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starRatingText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#D97706',
  },
  starReviewCount: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactProductName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0A',
    marginTop: 2,
  },
  compactBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8EEF2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  compactBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#C87D8A',
    letterSpacing: 0.5,
  },
  compactFeaturesContainer: {
    marginBottom: 12,
    gap: 6,
  },
  featureRowPro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  featureIconPro: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16A34A',
    marginRight: 8,
    marginTop: 1,
  },
  featureTextPro: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
    lineHeight: 17,
  },
  featureRowCon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  featureIconCon: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
    marginRight: 8,
    marginTop: 1,
  },
  featureTextCon: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#BE123C',
    flex: 1,
    lineHeight: 17,
  },
  inspectBtnCompact: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#C87D8A',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  inspectBtnTextCompact: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Shelf & History
  tabScrollContent: { padding: 18, paddingBottom: 50 },
  shelfCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  shelfCardTitle: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
  shelfCardNotes: { fontSize: 12.5, color: '#4B5563', marginTop: 4, lineHeight: 18 },
  deleteLinkText: { color: '#DC2626', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  historyMatchBadge: { backgroundColor: '#EBF4FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyMatchBadgeText: { color: '#1565C0', fontSize: 11, fontWeight: '700' },

  // Settings
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineActionBtnText: { color: '#000000', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  jsonPreviewBox: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, marginTop: 8 },
  jsonPreviewText: { fontSize: 11, color: '#1F2937' },
  successText: { color: '#16A34A', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center', marginBottom: 10 },

  // Bottom Nav Bar (Sephora Noir)
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingVertical: 13,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 11, color: '#886E7E', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  navTextActive: { color: '#C87D8A', fontWeight: '900' },

  // Segmented Control (Makyaj vs Cilt Bakımı)
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Dashboard Styles
  dashboardScrollContent: { padding: 16, paddingBottom: 60 },
  dashboardBanner: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboardGreeting: { fontSize: 11, fontWeight: '700', marginBottom: 2, letterSpacing: 0.8, textTransform: 'uppercase' },
  dashboardProfileTitle: { fontSize: 16, fontWeight: '800' },
  dashboardProfileSub: { fontSize: 11, marginTop: 4 },
  dashboardQuizBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dashboardQuizBtnText: { color: '#FFF', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },

  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricTagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  metricIcon: { fontSize: 14, marginBottom: 4 },
  metricTitle: { fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },
  metricValue: { fontSize: 10.5, fontWeight: '800', marginTop: 3, textAlign: 'center' },

  dashboardSearchCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  dashboardSearchTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  dashboardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  dashboardInput: { flex: 1, fontSize: 14 },
  dashboardActionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  dashboardActionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  trendingChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  trendingLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  trendingChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  trendingChipText: { fontSize: 11, fontWeight: '700' },

  categorySection: { marginBottom: 20 },
  categorySectionHeader: { marginBottom: 12 },
  categorySectionTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  categorySectionSubtitle: { fontSize: 11.5, marginTop: 2, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  categoryTile: {
    width: '31%',
    height: 115,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  categoryTileImage: { width: '100%', height: '100%' },
  categoryTileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28, 18, 25, 0.76)',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  categoryTileEmoji: { display: 'none' },
  categoryTileName: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textAlign: 'center' },
});
