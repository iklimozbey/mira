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
} from 'react-native';
import { apiClient } from './src/api/client';
import { ResearchReport, UserProfile, InventoryItem, QuotaInfo } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'research' | 'shelf' | 'history' | 'settings'>('research');

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('demo@mira.app');
  const [password, setPassword] = useState('mira1234');
  const [authError, setAuthError] = useState('');

  // Onboarding state: triggers right after registration/login if profile is incomplete
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    skin_type: '',
    skin_undertone: '',
    skin_concerns: [],
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
  const [newProdRating, setNewProdRating] = useState('4');

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

      // Check if user has already set their skin profile
      if (userProf.skin_type && userProf.skin_undertone) {
        setIsOnboardingCompleted(true);
      } else {
        setIsOnboardingCompleted(false);
        setOnboardingStep(1);
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
      setActiveTab('research');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await apiClient.updateProfile(profile);
      setProfile(updated);
      setProfileSavedMsg('Profile updated successfully!');
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

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const report = await apiClient.analyzeProduct(query);
      setCurrentReport(report);
      await refreshQuota();
    } catch (err: any) {
      alert(err.message);
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
        rating: parseInt(newProdRating, 10) || 4,
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

  // 1. Auth View
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.brandTitle}>MIRA</Text>
          <Text style={styles.brandTagline}>Personal Beauty & Shopping Assistant</Text>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TextInput
            style={styles.cleanInput}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.cleanInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAuth(false)}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleAuth(true)}>
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Onboarding Skin Questionnaire (Questions before first research)
  if (!isOnboardingCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.onboardingHeader}>
          <Text style={styles.onboardingTitle}>Tell Us About Your Skin</Text>
          <Text style={styles.onboardingSubtitle}>MIRA personalizes every recommendation to your unique profile.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.onboardingContent}>
          {onboardingStep === 1 && (
            <View style={styles.card}>
              <Text style={styles.stepHeader}>Step 1: What is your Skin Type?</Text>
              {['combination', 'oily', 'dry', 'sensitive'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.selectOption, profile.skin_type === st && styles.selectOptionActive]}
                  onPress={() => setProfile({ ...profile, skin_type: st })}
                >
                  <Text style={[styles.selectOptionText, profile.skin_type === st && styles.selectOptionTextActive]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.primaryBtn, !profile.skin_type && { opacity: 0.5 }]}
                disabled={!profile.skin_type}
                onPress={() => setOnboardingStep(2)}
              >
                <Text style={styles.primaryBtnText}>Next Step</Text>
              </TouchableOpacity>
            </View>
          )}

          {onboardingStep === 2 && (
            <View style={styles.card}>
              <Text style={styles.stepHeader}>Step 2: What is your Skin Undertone?</Text>
              {[
                { key: 'warm', label: 'Warm (Yellow / Golden)' },
                { key: 'cool', label: 'Cool (Pink / Rosy)' },
                { key: 'neutral', label: 'Neutral (Balanced)' },
              ].map((ut) => (
                <TouchableOpacity
                  key={ut.key}
                  style={[styles.selectOption, profile.skin_undertone === ut.key && styles.selectOptionActive]}
                  onPress={() => setProfile({ ...profile, skin_undertone: ut.key })}
                >
                  <Text style={[styles.selectOptionText, profile.skin_undertone === ut.key && styles.selectOptionTextActive]}>
                    {ut.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setOnboardingStep(1)}>
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }, !profile.skin_undertone && { opacity: 0.5 }]}
                  disabled={!profile.skin_undertone}
                  onPress={() => setOnboardingStep(3)}
                >
                  <Text style={styles.primaryBtnText}>Next Step</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {onboardingStep === 3 && (
            <View style={styles.card}>
              <Text style={styles.stepHeader}>Step 3: Any Special Concerns or Sensitivities?</Text>
              <Text style={styles.hintText}>Tap all that apply to help MIRA flag trigger ingredients:</Text>

              <View style={styles.chipsContainer}>
                {[
                  { key: 'rosacea', label: 'Rosacea (Gül Hastalığı)' },
                  { key: 'acne', label: 'Acne-Prone' },
                  { key: 'fungal_acne', label: 'Fungal Acne' },
                  { key: 'redness', label: 'Redness / Capillaries' },
                  { key: 'pores', label: 'Enlarged Pores' },
                  { key: 'eczema', label: 'Eczema / Dry Flakes' },
                ].map((c) => {
                  const active = (profile.skin_concerns || []).includes(c.key);
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        const cur = profile.skin_concerns || [];
                        const updated = active ? cur.filter((i) => i !== c.key) : [...cur, c.key];
                        setProfile({ ...profile, skin_concerns: updated });
                      }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setOnboardingStep(2)}>
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={finishOnboarding}>
                  <Text style={styles.primaryBtnText}>Complete Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Main Dashboard View
  return (
    <SafeAreaView style={styles.container}>
      {/* Centered Modern Mauve-Rose Header */}
      <View style={styles.navHeader}>
        <Text style={styles.headerTitle}>MIRA RESEARCH</Text>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>
            {profile.skin_type.toUpperCase()} • {profile.skin_undertone.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {activeTab === 'research' && (
          <View>
            {/* Minimalist Search Row */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search product or paste Trendyol / Gratis link..."
                placeholderTextColor="#A098A3"
                value={query}
                onChangeText={setQuery}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleAnalyze} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.searchBtnText}>Search</Text>}
              </TouchableOpacity>
            </View>

            {/* Structured Report Card */}
            {currentReport && (
              <View style={styles.reportCard}>
                <View style={styles.reportTopBar}>
                  <Text style={styles.productHeading}>{currentReport.product_name}</Text>
                  <View style={styles.scoreTag}>
                    <Text style={styles.scoreTagText}>{currentReport.suitability_score}% Match</Text>
                  </View>
                </View>

                <Text style={styles.summaryParagraph}>{currentReport.summary}</Text>

                {/* Skin Profile Rationale Box */}
                <View style={styles.skinRationaleCard}>
                  <Text style={styles.skinRationaleTitle}>Personal Compatibility Analysis</Text>
                  <Text style={styles.skinRationaleBody}>{currentReport.suitability_reason}</Text>
                </View>

                {/* Clinical Warnings */}
                {currentReport.clinical_warnings && currentReport.clinical_warnings.length > 0 && (
                  <View style={styles.clinicalAlertCard}>
                    <Text style={styles.clinicalAlertTitle}>Clinical Trigger Caution</Text>
                    {currentReport.clinical_warnings.map((w, idx) => (
                      <Text key={idx} style={styles.clinicalAlertText}>• {w}</Text>
                    ))}
                  </View>
                )}

                {/* Reality Check Verdict */}
                {currentReport.reality_check_reason ? (
                  <View style={styles.realityVerdictCard}>
                    <Text style={styles.realityVerdictTitle}>Reality Check: {currentReport.reality_check_verdict}</Text>
                    <Text style={styles.realityVerdictBody}>{currentReport.reality_check_reason}</Text>
                  </View>
                ) : null}

                {/* Pros & Cons */}
                <Text style={styles.sectionHeading}>Verified Pros</Text>
                {currentReport.pros.map((p, idx) => (
                  <Text key={idx} style={styles.bulletItem}>✓  {p}</Text>
                ))}

                <Text style={styles.sectionHeading}>Reported Cons & Drawbacks</Text>
                {currentReport.cons.map((c, idx) => (
                  <Text key={idx} style={styles.bulletItem}>✕  {c}</Text>
                ))}

                {/* Sponsored Warnings */}
                {currentReport.sponsored_flags.length > 0 && (
                  <View style={styles.sponsoredAlertCard}>
                    <Text style={styles.sponsoredAlertTitle}>Sponsored Content Note</Text>
                    {currentReport.sponsored_flags.map((flag, i) => (
                      <Text key={i} style={styles.sponsoredAlertText}>{flag}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'shelf' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Add Product to My Shelf</Text>
              <TextInput
                style={styles.cleanInput}
                placeholder="Product Name (e.g. MAC Studio Fix NC25)"
                placeholderTextColor="#999"
                value={newProdName}
                onChangeText={setNewProdName}
              />
              <TextInput
                style={styles.cleanInput}
                placeholder="Brand (optional)"
                placeholderTextColor="#999"
                value={newProdBrand}
                onChangeText={setNewProdBrand}
              />
              <TextInput
                style={styles.cleanInput}
                placeholder="Rating (1-5)"
                placeholderTextColor="#999"
                value={newProdRating}
                onChangeText={setNewProdRating}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.cleanInput}
                placeholder="Your experience (e.g. Loved it, oxidized after 2h)"
                placeholderTextColor="#999"
                value={newProdNotes}
                onChangeText={setNewProdNotes}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddShelfItem}>
                <Text style={styles.primaryBtnText}>Save to Shelf</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              {inventory.map((item) => (
                <View key={item.id} style={styles.shelfItemCard}>
                  <View style={styles.reportTopBar}>
                    <Text style={styles.shelfItemName}>{item.product_name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteShelfItem(item.id)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.shelfItemRating}>Rating: {item.rating || '-'}/5</Text>
                  {item.experience_notes ? <Text style={styles.shelfItemNotes}>"{item.experience_notes}"</Text> : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            {history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.shelfItemCard}
                onPress={() => {
                  setCurrentReport(item);
                  setActiveTab('research');
                }}
              >
                <Text style={styles.shelfItemName}>{item.product_name}</Text>
                <Text style={styles.shelfItemRating}>
                  {item.suitability_score}% Match • Verdict: {item.reality_check_verdict}
                </Text>
                <Text numberOfLines={2} style={styles.shelfItemNotes}>{item.summary}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'settings' && (
          <View>
            {/* Skin Profile Settings */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Skin Profile & Preferences</Text>

              <Text style={styles.fieldLabel}>Skin Type</Text>
              <TextInput
                style={styles.cleanInput}
                value={profile.skin_type}
                onChangeText={(v) => setProfile({ ...profile, skin_type: v })}
              />

              <Text style={styles.fieldLabel}>Skin Undertone</Text>
              <TextInput
                style={styles.cleanInput}
                value={profile.skin_undertone}
                onChangeText={(v) => setProfile({ ...profile, skin_undertone: v })}
              />

              <Text style={styles.fieldLabel}>Concerns & Allergies</Text>
              <View style={styles.chipsContainer}>
                {['rosacea', 'acne', 'fungal_acne', 'redness', 'pores', 'eczema'].map((concern) => {
                  const active = (profile.skin_concerns || []).includes(concern);
                  return (
                    <TouchableOpacity
                      key={concern}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => {
                        const cur = profile.skin_concerns || [];
                        const updated = active ? cur.filter((i) => i !== concern) : [...cur, concern];
                        setProfile({ ...profile, skin_concerns: updated });
                      }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {concern === 'rosacea' ? 'Rosacea' : concern === 'acne' ? 'Acne-Prone' : concern}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {profileSavedMsg ? <Text style={styles.successMsg}>{profileSavedMsg}</Text> : null}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile}>
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy & Account Settings */}
            <View style={[styles.card, { marginTop: 14 }]}>
              <Text style={styles.cardHeading}>Account & Privacy</Text>

              <TouchableOpacity style={styles.secondaryBtn} onPress={handleExportData}>
                <Text style={styles.secondaryBtnText}>Export Personal Data (JSON)</Text>
              </TouchableOpacity>

              {exportedDataJson ? (
                <View style={styles.jsonBox}>
                  <Text style={styles.jsonText}>{exportedDataJson}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: '#E57373', marginTop: 10 }]}
                onPress={handleDeleteAccount}
              >
                <Text style={[styles.secondaryBtnText, { color: '#D32F2F' }]}>Permanently Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Elegant Rose-Mauve Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('research')}>
          <Text style={[styles.navLabel, activeTab === 'research' && styles.navLabelActive]}>Research</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('shelf');
            loadInventory();
          }}
        >
          <Text style={[styles.navLabel, activeTab === 'shelf' && styles.navLabelActive]}>My Shelf</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => setActiveTab('settings')}>
          <Text style={[styles.navLabel, activeTab === 'settings' && styles.navLabelActive]}>Profile & Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F5' },

  // Auth
  authContainer: { margin: 24, marginTop: 100, padding: 24, backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#9C6B7B', shadowOpacity: 0.08, shadowRadius: 15, elevation: 3 },
  brandTitle: { fontSize: 30, fontWeight: '800', color: '#6B4E5B', textAlign: 'center', letterSpacing: 2 },
  brandTagline: { fontSize: 13, color: '#9E8893', textAlign: 'center', marginBottom: 24, marginTop: 6 },

  // Onboarding
  onboardingHeader: { padding: 24, paddingTop: 40, alignItems: 'center' },
  onboardingTitle: { fontSize: 24, fontWeight: '700', color: '#5B3E4C', textAlign: 'center' },
  onboardingSubtitle: { fontSize: 13, color: '#8F7A85', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  onboardingContent: { paddingHorizontal: 20, paddingBottom: 40 },
  stepHeader: { fontSize: 17, fontWeight: '700', color: '#4A323E', marginBottom: 16 },
  hintText: { fontSize: 13, color: '#7E6B75', marginBottom: 14 },
  selectOption: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E8DFE3', backgroundColor: '#FFF', marginBottom: 10 },
  selectOptionActive: { borderColor: '#B56576', backgroundColor: '#FBF0F3' },
  selectOptionText: { fontSize: 15, color: '#555', fontWeight: '500' },
  selectOptionTextActive: { color: '#B56576', fontWeight: '700' },

  // Top Nav Header (Mauve-Rose Luxury)
  navHeader: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#7A5265', // Elegant Rose-Mauve
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  headerPillText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Main Content
  mainContent: { padding: 16, paddingBottom: 40 },

  // Search Row
  searchContainer: { flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 4 },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E6DDE1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  searchBtn: {
    backgroundColor: '#8C566C',
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Cards
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#EDE6E9', marginBottom: 14 },
  cardHeading: { fontSize: 16, fontWeight: '700', color: '#4A323E', marginBottom: 14 },
  cleanInput: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E8DFE3', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 14, color: '#333' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#7E6B75', marginBottom: 6, textTransform: 'uppercase' },

  // Report Card & Typography
  reportCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EBE2E6' },
  reportTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  productHeading: { fontSize: 17, fontWeight: '700', color: '#3B2A33', flex: 1, marginRight: 8 },
  scoreTag: { backgroundColor: '#EBF4FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scoreTagText: { color: '#1E6091', fontWeight: '800', fontSize: 12 },
  summaryParagraph: { fontSize: 13.5, color: '#555', lineHeight: 20, marginBottom: 14 },

  // Contextual Rationale Boxes
  skinRationaleCard: { backgroundColor: '#FDF7F4', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F2DFD7' },
  skinRationaleTitle: { fontSize: 12, fontWeight: '700', color: '#94533C', marginBottom: 4 },
  skinRationaleBody: { fontSize: 13, color: '#5C3829', lineHeight: 18 },

  clinicalAlertCard: { backgroundColor: '#FDEDEC', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FADBD8' },
  clinicalAlertTitle: { fontSize: 12, fontWeight: '700', color: '#B03A2E', marginBottom: 4 },
  clinicalAlertText: { fontSize: 12.5, color: '#641E16', lineHeight: 18 },

  realityVerdictCard: { backgroundColor: '#F7EDF8', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E8D4EA' },
  realityVerdictTitle: { fontSize: 12, fontWeight: '700', color: '#7B2D85', marginBottom: 4 },
  realityVerdictBody: { fontSize: 12.5, color: '#4D1D53', lineHeight: 18 },

  sponsoredAlertCard: { backgroundColor: '#FEF9E7', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#F9E79F' },
  sponsoredAlertTitle: { fontSize: 12, fontWeight: '700', color: '#B7950B', marginBottom: 4 },
  sponsoredAlertText: { fontSize: 12, color: '#7D6608' },

  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#4A323E', marginTop: 10, marginBottom: 6 },
  bulletItem: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },

  // Shelf & History Items
  shelfItemCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EDE6E9', marginBottom: 10 },
  shelfItemName: { fontSize: 15, fontWeight: '700', color: '#3B2A33', flex: 1 },
  shelfItemRating: { fontSize: 12, color: '#7E6B75', fontWeight: '600', marginTop: 4 },
  shelfItemNotes: { fontSize: 12.5, color: '#666', marginTop: 4, fontStyle: 'italic' },
  deleteLink: { color: '#C62828', fontSize: 12, fontWeight: '600' },

  // Chips
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E8DFE3', backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#8C566C', borderColor: '#8C566C' },
  chipText: { fontSize: 12.5, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: '700' },

  // Buttons
  primaryBtn: { backgroundColor: '#8C566C', paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  secondaryBtn: { borderWidth: 1, borderColor: '#8C566C', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  secondaryBtnText: { color: '#8C566C', fontWeight: '600', fontSize: 13 },

  // Navigation Bar (Clean Mauve-Rose Luxury)
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE2E6',
    paddingVertical: 14,
  },
  navTab: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 12.5, color: '#9E8893', fontWeight: '500' },
  navLabelActive: { color: '#7A5265', fontWeight: '800' },

  // Utilities
  errorText: { color: '#C62828', textAlign: 'center', marginBottom: 10, fontSize: 13 },
  successMsg: { color: '#2E7D32', fontWeight: '600', fontSize: 13, marginBottom: 8 },
  jsonBox: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 10, marginTop: 8 },
  jsonText: { fontSize: 11, color: '#333' },
});
