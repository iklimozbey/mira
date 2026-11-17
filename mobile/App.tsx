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
} from 'react-native';
import { apiClient } from './src/api/client';
import { ResearchReport, UserProfile, InventoryItem, QuotaInfo } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'shelf' | 'history' | 'settings'>('search');

  // View state: 'search' | 'report_detail' | 'suggestions_list'
  const [currentScreen, setCurrentScreen] = useState<'search' | 'report_detail' | 'suggestions_list'>('search');

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

  const handleAuth = async (isRegister: boolean) => {
    setAuthError('');
    try {
      if (isRegister) {
        await apiClient.register(email, password);
      }
      await apiClient.login(email, password);
      const userProf = await apiClient.getProfile();
      setProfile(userProf);
      await refreshQuota();
      setIsAuthenticated(true);

      if (userProf.skin_type && userProf.skin_undertone) {
        setIsOnboardingCompleted(true);
      } else {
        setIsOnboardingCompleted(false);
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

  // 1. Auth View (Modern Minimalist Card)
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContainer}>
          <View style={styles.modernAuthCard}>
            <Text style={styles.heroLogo}>MIRA</Text>
            <Text style={styles.heroSubtitle}>Intelligent Beauty & Shopping Research</Text>

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <TextInput
              style={styles.heroInput}
              placeholder="Email address"
              placeholderTextColor="#B0A6AD"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.heroInput}
              placeholder="Password"
              placeholderTextColor="#B0A6AD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.mainActionBtn} onPress={() => handleAuth(false)}>
              <Text style={styles.mainActionBtnText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: '#B56576', marginTop: 10 }]}
              onPress={() => {
                setEmail('demo@mira.app');
                setPassword('mira1234');
                handleAuth(false);
              }}
            >
              <Text style={styles.mainActionBtnText}>Quick Demo Access (One-Tap)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textOnlyBtn} onPress={() => handleAuth(true)}>
              <Text style={styles.textOnlyBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Onboarding Skin Profile Modal / Form
  if (!isOnboardingCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.centerContainer}>
          <View style={styles.onboardingCard}>
            <Text style={styles.formTitle}>Tell MIRA About Your Skin</Text>
            <Text style={styles.formSubtitle}>Quick answers to calibrate personalized suitability scores.</Text>

            {/* Skin Type */}
            <Text style={styles.formSectionLabel}>Skin Type</Text>
            <View style={styles.gridRow}>
              {['combination', 'oily', 'dry', 'sensitive'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.chipButton, profile.skin_type === st && styles.chipButtonActive]}
                  onPress={() => setProfile({ ...profile, skin_type: st })}
                >
                  <Text style={[styles.chipButtonText, profile.skin_type === st && styles.chipButtonTextActive]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Undertone */}
            <Text style={styles.formSectionLabel}>Undertone</Text>
            <View style={styles.gridRow}>
              {['warm', 'cool', 'neutral'].map((ut) => (
                <TouchableOpacity
                  key={ut}
                  style={[styles.chipButton, profile.skin_undertone === ut && styles.chipButtonActive]}
                  onPress={() => setProfile({ ...profile, skin_undertone: ut })}
                >
                  <Text style={[styles.chipButtonText, profile.skin_undertone === ut && styles.chipButtonTextActive]}>
                    {ut.charAt(0).toUpperCase() + ut.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Concerns */}
            <Text style={styles.formSectionLabel}>Concerns & Triggers (Tap to select)</Text>
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
                    style={[styles.chipButton, active && styles.chipButtonActive]}
                    onPress={() => {
                      const cur = profile.skin_concerns || [];
                      const updated = active ? cur.filter((i) => i !== c.key) : [...cur, c.key];
                      setProfile({ ...profile, skin_concerns: updated });
                    }}
                  >
                    <Text style={[styles.chipButtonText, active && styles.chipButtonTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.mainActionBtn, { marginTop: 20 }]} onPress={finishOnboarding}>
              <Text style={styles.mainActionBtnText}>Start Researching</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Suggestions List Screen (when user types general queries like 'maybelline ruj')
  if (currentScreen === 'suggestions_list' && currentReport?.suggested_products) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('search')}>
            <Text style={styles.backButtonText}>← Search</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Product Choices</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.detailScrollContent}>
          <Text style={styles.disambiguationHeader}>{currentReport.disambiguation_message}</Text>
          <Text style={styles.disambiguationSub}>Sıralama: En yüksek kullanıcı puanı ve değerlendirme sayısı</Text>

          {currentReport.suggested_products.map((item, idx) => (
            <View key={idx} style={styles.suggestionCard}>
              <Image source={{ uri: item.image_url }} style={styles.suggestionImage} resizeMode="cover" />
              <View style={styles.suggestionInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                  </View>
                  <View style={styles.ratingBox}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingScore}>{item.rating}</Text>
                    <Text style={styles.ratingCount}>({item.review_count.toLocaleString()})</Text>
                  </View>
                </View>

                <Text style={styles.suggestionName}>{item.product_name}</Text>
                <Text style={styles.suggestionTag}>{item.finish_or_tag}</Text>
                <Text style={styles.suggestionHighlight}>{item.brief_highlight}</Text>

                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={() => {
                    setQuery(item.product_name);
                    handleAnalyze(item.product_name);
                  }}
                >
                  <Text style={styles.inspectBtnText}>Bu Ürünü Detaylı İncele →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. Separate Full-Screen Report Detail Screen
  if (currentScreen === 'report_detail' && currentReport) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Top Header with Back Navigation */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('search')}>
            <Text style={styles.backButtonText}>← Search</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Product Report</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.detailScrollContent}>
          {/* Big Hero Score Card */}
          <View style={styles.heroMatchCard}>
            <View style={styles.heroScoreBadge}>
              <Text style={styles.heroScoreNumber}>{currentReport.suitability_score}%</Text>
              <Text style={styles.heroScoreLabel}>Match</Text>
            </View>
            <Text style={styles.heroProductName}>{currentReport.product_name}</Text>
            <Text style={styles.heroSummaryText}>{currentReport.summary}</Text>
          </View>

          {/* Skin Compatibility Rationale Card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardHeader}>Personal Skin Analysis</Text>
            <Text style={styles.detailCardBody}>{currentReport.suitability_reason}</Text>
          </View>

          {/* Clinical Trigger Warning Card (Rosacea / Acne) */}
          {currentReport.clinical_warnings && currentReport.clinical_warnings.length > 0 && (
            <View style={styles.clinicalCard}>
              <Text style={styles.clinicalCardHeader}>Dermatological & Clinical Caution</Text>
              {currentReport.clinical_warnings.map((w, idx) => (
                <Text key={idx} style={styles.clinicalCardBody}>• {w}</Text>
              ))}
            </View>
          )}

          {/* Reality Check Verdict Card */}
          {currentReport.reality_check_reason ? (
            <View style={styles.realityCard}>
              <View style={styles.realityHeaderRow}>
                <Text style={styles.realityHeaderTitle}>Reality Check</Text>
                <View style={styles.verdictBadge}>
                  <Text style={styles.verdictBadgeText}>{currentReport.reality_check_verdict}</Text>
                </View>
              </View>
              <Text style={styles.realityBody}>{currentReport.reality_check_reason}</Text>
            </View>
          ) : null}

          {/* Pros & Cons Card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardHeader}>Key Benefits</Text>
            {currentReport.pros.map((p, idx) => (
              <Text key={idx} style={styles.proItem}>✓  {p}</Text>
            ))}

            <Text style={[styles.detailCardHeader, { marginTop: 16 }]}>Recurring Complaints</Text>
            {currentReport.cons.map((c, idx) => (
              <Text key={idx} style={styles.conItem}>✕  {c}</Text>
            ))}
          </View>

          {/* Sponsored Content Warnings */}
          {currentReport.sponsored_flags.length > 0 && (
            <View style={styles.sponsoredCard}>
              <Text style={styles.sponsoredHeader}>Sponsored Marketing Notice</Text>
              {currentReport.sponsored_flags.map((flag, i) => (
                <Text key={i} style={styles.sponsoredBody}>{flag}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. Main Tabbed Layout (Centered Search View)
  if (currentScreen !== 'search') {
    // Safety check: ensure screen correctly falls through if not 'search'
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Rose-Mauve Header */}
      <View style={styles.topHeader}>
        <View style={{ width: 40 }} />
        <Text style={styles.topHeaderTitle}>MIRA RESEARCH</Text>
        <View style={styles.skinProfileTag}>
          <Text style={styles.skinProfileTagText}>
            {profile.skin_type ? profile.skin_type.toUpperCase() : 'PROFILE'}
          </Text>
        </View>
      </View>

      {/* Main Tab Content */}
      {activeTab === 'search' && (
        <View style={styles.centerSearchLayout}>
          <View style={styles.searchHeroBox}>
            <Text style={styles.searchPromptBig}>What product would you like to investigate?</Text>

            {/* Big Centered Rounded Search Box */}
            <View style={styles.bigSearchInputContainer}>
              <TextInput
                style={styles.bigSearchInput}
                placeholder="Product name or paste link..."
                placeholderTextColor="#A89EAA"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleAnalyze}
              />
            </View>

            <TouchableOpacity
              style={[styles.bigSearchActionBtn, loading && { opacity: 0.7 }]}
              onPress={() => handleAnalyze()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.bigSearchActionBtnText}>Analyze Product</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.searchMicroHint}>
              MIRA checks reviews, Rosacea/Acne triggers, and shelf duplication.
            </Text>
          </View>
        </View>
      )}

      {activeTab === 'shelf' && (
        <ScrollView contentContainerStyle={styles.tabScrollContent}>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardHeader}>Add Product to My Shelf</Text>
            <TextInput
              style={styles.heroInput}
              placeholder="Product Name (e.g. NARS Light Reflecting)"
              placeholderTextColor="#A098A3"
              value={newProdName}
              onChangeText={setNewProdName}
            />
            <TextInput
              style={styles.heroInput}
              placeholder="Brand"
              placeholderTextColor="#A098A3"
              value={newProdBrand}
              onChangeText={setNewProdBrand}
            />
            <TextInput
              style={styles.heroInput}
              placeholder="Your notes (e.g. Loved finish, oxidized after 2h)"
              placeholderTextColor="#A098A3"
              value={newProdNotes}
              onChangeText={setNewProdNotes}
            />
            <TouchableOpacity style={styles.mainActionBtn} onPress={handleAddShelfItem}>
              <Text style={styles.mainActionBtnText}>Save to Shelf</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 14 }}>
            {inventory.map((item) => (
              <View key={item.id} style={styles.shelfCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.shelfCardTitle}>{item.product_name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteShelfItem(item.id)}>
                    <Text style={styles.deleteLinkText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                {item.experience_notes ? (
                  <Text style={styles.shelfCardNotes}>"{item.experience_notes}"</Text>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === 'history' && (
        <ScrollView contentContainerStyle={styles.tabScrollContent}>
          {history.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.shelfCard}
              onPress={() => {
                setCurrentReport(item);
                setCurrentScreen('report_detail');
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.shelfCardTitle}>{item.product_name}</Text>
                <View style={styles.historyMatchBadge}>
                  <Text style={styles.historyMatchBadgeText}>{item.suitability_score}%</Text>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.shelfCardNotes}>{item.summary}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {activeTab === 'settings' && (
        <ScrollView contentContainerStyle={styles.tabScrollContent}>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardHeader}>Skin Attributes & Preferences</Text>

            <Text style={styles.formSectionLabel}>Skin Type</Text>
            <TextInput
              style={styles.heroInput}
              value={profile.skin_type}
              onChangeText={(v) => setProfile({ ...profile, skin_type: v })}
            />

            <Text style={styles.formSectionLabel}>Skin Undertone</Text>
            <TextInput
              style={styles.heroInput}
              value={profile.skin_undertone}
              onChangeText={(v) => setProfile({ ...profile, skin_undertone: v })}
            />

            <Text style={styles.formSectionLabel}>Concerns & Triggers</Text>
            <View style={styles.gridRow}>
              {['rosacea', 'acne', 'fungal_acne', 'redness', 'pores', 'eczema'].map((c) => {
                const active = (profile.skin_concerns || []).includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chipButton, active && styles.chipButtonActive]}
                    onPress={() => {
                      const cur = profile.skin_concerns || [];
                      const updated = active ? cur.filter((i) => i !== c) : [...cur, c];
                      setProfile({ ...profile, skin_concerns: updated });
                    }}
                  >
                    <Text style={[styles.chipButtonText, active && styles.chipButtonTextActive]}>
                      {c === 'rosacea' ? 'Rosacea' : c === 'acne' ? 'Acne-Prone' : c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {profileSavedMsg ? <Text style={styles.successText}>{profileSavedMsg}</Text> : null}

            <TouchableOpacity style={styles.mainActionBtn} onPress={handleSaveProfile}>
              <Text style={styles.mainActionBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.detailCard, { marginTop: 14 }]}>
            <Text style={styles.detailCardHeader}>Account & KVKK Privacy</Text>

            <TouchableOpacity style={styles.outlineActionBtn} onPress={handleExportData}>
              <Text style={styles.outlineActionBtnText}>Export Personal Data (JSON)</Text>
            </TouchableOpacity>

            {exportedDataJson ? (
              <View style={styles.jsonPreviewBox}>
                <Text style={styles.jsonPreviewText}>{exportedDataJson}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.outlineActionBtn, { borderColor: '#E57373', marginTop: 10 }]}
              onPress={handleDeleteAccount}
            >
              <Text style={[styles.outlineActionBtnText, { color: '#D32F2F' }]}>Permanently Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Clean Bottom Navigation Bar */}
      <View style={styles.bottomNavBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => { setActiveTab('search'); setCurrentScreen('search'); }}>
          <Text style={[styles.navText, activeTab === 'search' && styles.navTextActive]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('shelf');
            loadInventory();
          }}
        >
          <Text style={[styles.navText, activeTab === 'shelf' && styles.navTextActive]}>My Shelf</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('settings')}>
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Profile & Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6F4' },
  centerContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  // Top Mauve Header
  topHeader: {
    backgroundColor: '#6D4658',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  skinProfileTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skinProfileTagText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
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
    fontWeight: '700',
    color: '#3C2833',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
  },
  bigSearchInputContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E8DCE1',
    shadowColor: '#8C566C',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 16,
  },
  bigSearchInput: {
    fontSize: 16,
    color: '#2A1F26',
  },
  bigSearchActionBtn: {
    width: '100%',
    backgroundColor: '#7A4D62',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7A4D62',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bigSearchActionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchMicroHint: {
    fontSize: 12,
    color: '#9E8D96',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },

  // Separate Full-Screen Report Detail
  detailScrollContent: { padding: 18, paddingBottom: 50 },
  heroMatchCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE5EA',
    shadowColor: '#7A4D62',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  heroScoreBadge: {
    backgroundColor: '#EBF4FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroScoreNumber: { fontSize: 28, fontWeight: '800', color: '#1565C0' },
  heroScoreLabel: { fontSize: 11, fontWeight: '700', color: '#1E88E5', textTransform: 'uppercase' },
  heroProductName: { fontSize: 19, fontWeight: '800', color: '#2E1E26', textAlign: 'center', marginBottom: 8 },
  heroSummaryText: { fontSize: 14, color: '#574850', textAlign: 'center', lineHeight: 21 },

  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFE5EA',
    marginBottom: 14,
  },
  detailCardHeader: { fontSize: 15, fontWeight: '700', color: '#3A2732', marginBottom: 10 },
  detailCardBody: { fontSize: 13.5, color: '#5C4A54', lineHeight: 21 },

  clinicalCard: {
    backgroundColor: '#FDECEF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F9D1D8',
    marginBottom: 14,
  },
  clinicalCardHeader: { fontSize: 14, fontWeight: '700', color: '#A9243E', marginBottom: 6 },
  clinicalCardBody: { fontSize: 13, color: '#681727', lineHeight: 20, marginBottom: 4 },

  realityCard: {
    backgroundColor: '#F8EEF9',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8D1EA',
    marginBottom: 14,
  },
  realityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  realityHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#682570' },
  verdictBadge: { backgroundColor: '#7B2A85', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verdictBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  realityBody: { fontSize: 13, color: '#4B1852', lineHeight: 20 },

  proItem: { fontSize: 13.5, color: '#2E7D32', marginBottom: 6, lineHeight: 20 },
  conItem: { fontSize: 13.5, color: '#C62828', marginBottom: 6, lineHeight: 20 },

  sponsoredCard: {
    backgroundColor: '#FFFBEA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F8E8A9',
    marginBottom: 14,
  },
  sponsoredHeader: { fontSize: 13, fontWeight: '700', color: '#9A7B0A', marginBottom: 4 },
  sponsoredBody: { fontSize: 12.5, color: '#685304', lineHeight: 18 },

  // Onboarding Form Card (Compact Popup Style)
  onboardingCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EDE2E7',
    shadowColor: '#6D4658',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: '#3A2732', textAlign: 'center' },
  formSubtitle: { fontSize: 13, color: '#887580', textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  formSectionLabel: { fontSize: 12, fontWeight: '700', color: '#7E6B75', textTransform: 'uppercase', marginBottom: 8, marginTop: 10 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chipButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DCE1',
    backgroundColor: '#FAF7F8',
  },
  chipButtonActive: {
    backgroundColor: '#7A4D62',
    borderColor: '#7A4D62',
  },
  chipButtonText: { fontSize: 13, color: '#55454F', fontWeight: '500' },
  chipButtonTextActive: { color: '#FFF', fontWeight: '700' },

  // Auth Card
  modernAuthCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: '#EDE2E7',
    shadowColor: '#6D4658',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  heroLogo: { fontSize: 32, fontWeight: '900', color: '#6D4658', textAlign: 'center', letterSpacing: 3 },
  heroSubtitle: { fontSize: 13, color: '#887580', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  heroInput: {
    backgroundColor: '#FAF7F8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DCE1',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  mainActionBtn: {
    backgroundColor: '#7A4D62',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  mainActionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  textOnlyBtn: { marginTop: 14, alignItems: 'center' },
  textOnlyBtnText: { color: '#7A4D62', fontSize: 13, fontWeight: '600' },

  // Suggestions List Styles
  disambiguationHeader: { fontSize: 18, fontWeight: '800', color: '#3A2732', marginBottom: 4, lineHeight: 24 },
  disambiguationSub: { fontSize: 12, color: '#887580', marginBottom: 16 },
  suggestionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE5EA',
    shadowColor: '#6D4658',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  suggestionImage: { width: '100%', height: 160, backgroundColor: '#FAF6F8' },
  suggestionInfo: { padding: 16 },
  rankBadge: { backgroundColor: '#F3E8EE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rankBadgeText: { fontSize: 11, fontWeight: '800', color: '#7A4D62' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStar: { color: '#F59E0B', fontSize: 14 },
  ratingScore: { fontSize: 13, fontWeight: '800', color: '#2E1E26' },
  ratingCount: { fontSize: 11, color: '#888' },
  suggestionName: { fontSize: 16, fontWeight: '700', color: '#2E1E26', marginTop: 8 },
  suggestionTag: { fontSize: 12, color: '#7A4D62', fontWeight: '600', marginTop: 2 },
  suggestionHighlight: { fontSize: 12.5, color: '#685A62', marginTop: 6, lineHeight: 18 },
  inspectBtn: {
    backgroundColor: '#7A4D62',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  inspectBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Shelf & History
  tabScrollContent: { padding: 18, paddingBottom: 50 },
  shelfCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE5EA',
    marginBottom: 10,
  },
  shelfCardTitle: { fontSize: 15, fontWeight: '700', color: '#2E1E26' },
  shelfCardNotes: { fontSize: 12.5, color: '#685A62', marginTop: 4, lineHeight: 18 },
  deleteLinkText: { color: '#D32F2F', fontSize: 12, fontWeight: '600' },
  historyMatchBadge: { backgroundColor: '#EBF4FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  historyMatchBadgeText: { color: '#1565C0', fontSize: 11, fontWeight: '700' },

  // Settings
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: '#7A4D62',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineActionBtnText: { color: '#7A4D62', fontSize: 13, fontWeight: '600' },
  jsonPreviewBox: { backgroundColor: '#F5EFF2', padding: 10, borderRadius: 10, marginTop: 8 },
  jsonPreviewText: { fontSize: 11, color: '#333' },
  successText: { color: '#2E7D32', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  errorText: { color: '#D32F2F', fontSize: 13, textAlign: 'center', marginBottom: 10 },

  // Bottom Nav Bar
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE0E5',
    paddingVertical: 13,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 12, color: '#9E8D96', fontWeight: '500' },
  navTextActive: { color: '#6D4658', fontWeight: '800' },
});
