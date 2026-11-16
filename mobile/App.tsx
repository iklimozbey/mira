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
import { ResearchReport, UserProfile, InventoryItem } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'research' | 'shelf' | 'history' | 'profile'>('research');

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('demo@mira.app');
  const [password, setPassword] = useState('mira1234');
  const [authError, setAuthError] = useState('');

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    skin_type: 'combination',
    skin_undertone: 'warm',
    skin_concerns: ['acne', 'redness'],
    allergies_sensitivities: [],
    budget_level: 'medium',
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Research state
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<ResearchReport | null>(null);
  const [history, setHistory] = useState<ResearchReport[]>([]);

  // Shelf / Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdNotes, setNewProdNotes] = useState('');
  const [newProdRating, setNewProdRating] = useState('4');

  const handleAuth = async (isRegister: boolean) => {
    setAuthError('');
    try {
      if (isRegister) {
        await apiClient.register(email, password);
      }
      await apiClient.login(email, password);
      const userProf = await apiClient.getProfile();
      setProfile(userProf);
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await apiClient.updateProfile(profile);
      setProfile(updated);
      setProfileSavedMsg('Profile saved! AI analyses will now use these preferences.');
      setTimeout(() => setProfileSavedMsg(''), 3000);
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
    } catch (err) {
      // ignore if empty
    }
  };

  const loadInventory = async () => {
    try {
      const items = await apiClient.getInventory();
      setInventory(items);
    } catch (err) {
      // ignore
    }
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authCard}>
          <Text style={styles.brandTitle}>MIRA</Text>
          <Text style={styles.subtitle}>AI-Powered Personal Cosmetic & Shopping Researcher</Text>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAuth(false)}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleAuth(true)}>
            <Text style={styles.secondaryBtnText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>MIRA Research</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{profile.skin_type || 'Set Profile'} • {profile.skin_undertone || 'Tone'}</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'research' && (
          <View>
            <Text style={styles.sectionTitle}>Ask MIRA to Research a Product</Text>
            <Text style={styles.helperText}>
              Paste a product name or link (e.g., "Estee Lauder Double Wear Foundation" or Trendyol link)
            </Text>

            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Product name or URL..."
                value={query}
                onChangeText={setQuery}
              />
              <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Research</Text>}
              </TouchableOpacity>
            </View>

            {currentReport && (
              <View style={styles.reportCard}>
                <View style={styles.scoreRow}>
                  <Text style={styles.productTitle}>{currentReport.product_name}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{currentReport.suitability_score}/100 Match</Text>
                  </View>
                </View>

                <Text style={styles.summaryText}>{currentReport.summary}</Text>

                <View style={styles.personalBox}>
                  <Text style={styles.boxHeading}>Why this score for your skin profile:</Text>
                  <Text style={styles.boxBody}>{currentReport.suitability_reason}</Text>
                </View>

                {currentReport.reality_check_reason ? (
                  <View style={styles.realityBox}>
                    <Text style={styles.realityHeading}>
                      ⚖️ Reality Check Verdict: {currentReport.reality_check_verdict}
                    </Text>
                    <Text style={styles.boxBody}>{currentReport.reality_check_reason}</Text>
                  </View>
                ) : null}

                <Text style={styles.listHeader}>✅ Verified Pros</Text>
                {currentReport.pros.map((p, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {p}</Text>
                ))}

                <Text style={styles.listHeader}>⚠️ Reported Cons & Complaints</Text>
                {currentReport.cons.map((c, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {c}</Text>
                ))}

                {currentReport.sponsored_flags.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>🛡️ Sponsored Content Alert</Text>
                    {currentReport.sponsored_flags.map((flag, i) => (
                      <Text key={i} style={styles.warningText}>{flag}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'shelf' && (
          <View>
            <Text style={styles.sectionTitle}>My Shelf & Product Memory</Text>
            <Text style={styles.helperText}>
              Log products you have tried so MIRA remembers what worked or oxidized on your skin.
            </Text>

            <View style={styles.reportCard}>
              <TextInput
                style={styles.input}
                placeholder="Product Name (e.g., MAC Studio Fix NC25)"
                value={newProdName}
                onChangeText={setNewProdName}
              />
              <TextInput
                style={styles.input}
                placeholder="Brand (optional)"
                value={newProdBrand}
                onChangeText={setNewProdBrand}
              />
              <TextInput
                style={styles.input}
                placeholder="Rating (1-5)"
                value={newProdRating}
                onChangeText={setNewProdRating}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Your experience (e.g., Oxidized after 2h, loved the coverage)"
                value={newProdNotes}
                onChangeText={setNewProdNotes}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddShelfItem}>
                <Text style={styles.primaryBtnText}>+ Add to Personal Memory</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 18 }}>
              {inventory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.productTitle}>{item.product_name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteShelfItem(item.id)}>
                      <Text style={{ color: '#D32F2F', fontWeight: '600', fontSize: 12 }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.scoreText}>Rating: {item.rating || '-'}/5</Text>
                  {item.experience_notes ? (
                    <Text style={[styles.helperText, { marginTop: 4, marginBottom: 0 }]}>
                      Note: "{item.experience_notes}"
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.reportCard}>
            <Text style={styles.sectionTitle}>Your Personal Skin & Shopping Profile</Text>
            <Text style={styles.helperText}>MIRA evaluates every product against these attributes.</Text>

            <Text style={styles.label}>Skin Type (oily, dry, combination, sensitive)</Text>
            <TextInput
              style={styles.input}
              value={profile.skin_type}
              onChangeText={(v) => setProfile({ ...profile, skin_type: v })}
            />

            <Text style={styles.label}>Skin Undertone (warm, cool, neutral)</Text>
            <TextInput
              style={styles.input}
              value={profile.skin_undertone}
              onChangeText={(v) => setProfile({ ...profile, skin_undertone: v })}
            />

            <Text style={styles.label}>Budget Preference (low, medium, luxury)</Text>
            <TextInput
              style={styles.input}
              value={profile.budget_level}
              onChangeText={(v) => setProfile({ ...profile, budget_level: v })}
            />

            {profileSavedMsg ? <Text style={styles.successText}>{profileSavedMsg}</Text> : null}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile}>
              <Text style={styles.primaryBtnText}>Save Personal Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            <Text style={styles.sectionTitle}>Past Product Research</Text>
            {history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => {
                  setCurrentReport(item);
                  setActiveTab('research');
                }}
              >
                <Text style={styles.productTitle}>{item.product_name}</Text>
                <Text style={styles.scoreText}>{item.suitability_score}% Personal Match</Text>
                <Text numberOfLines={2} style={styles.helperText}>{item.summary}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('research')}>
          <Text style={[styles.tabText, activeTab === 'research' && styles.activeTabText]}>🔍 Research</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('shelf');
            loadInventory();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'shelf' && styles.activeTabText]}>👜 My Shelf</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>📚 History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  authCard: { margin: 24, marginTop: 80, padding: 24, backgroundColor: '#FFF', borderRadius: 16, elevation: 3 },
  brandTitle: { fontSize: 32, fontWeight: '800', color: '#2D232E', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6E656F', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
  headerLogo: { fontSize: 20, fontWeight: '700', color: '#2D232E' },
  badge: { backgroundColor: '#F1E9E4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, color: '#5A4A42', fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#2D232E', marginBottom: 4 },
  helperText: { fontSize: 13, color: '#777', marginBottom: 16 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 20 },
  analyzeBtn: { backgroundColor: '#B56576', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 10 },
  primaryBtn: { backgroundColor: '#B56576', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#B56576' },
  secondaryBtnText: { color: '#B56576', fontWeight: '600', fontSize: 15 },
  reportCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginTop: 8, borderWidth: 1, borderColor: '#EFEFEF' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  productTitle: { fontSize: 18, fontWeight: '700', color: '#222', flex: 1 },
  scoreBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scoreText: { color: '#1565C0', fontWeight: '700', fontSize: 13 },
  summaryText: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 14 },
  personalBox: { backgroundColor: '#FDF6F0', padding: 12, borderRadius: 10, marginBottom: 14 },
  realityBox: { backgroundColor: '#F3E5F5', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#CE93D8' },
  realityHeading: { fontWeight: '700', color: '#6A1B9A', marginBottom: 4, fontSize: 13 },
  boxHeading: { fontWeight: '700', color: '#8D5B4C', marginBottom: 4, fontSize: 13 },
  boxBody: { color: '#4A3B32', fontSize: 13, lineHeight: 18 },
  listHeader: { fontWeight: '700', fontSize: 15, marginTop: 10, marginBottom: 6, color: '#2D232E' },
  bulletItem: { fontSize: 13, color: '#333', marginBottom: 4, lineHeight: 18 },
  warningBox: { backgroundColor: '#FFF8E1', padding: 12, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#FFE082' },
  warningTitle: { fontWeight: '700', color: '#F57F17', marginBottom: 4, fontSize: 13 },
  warningText: { fontSize: 12, color: '#5D4037' },
  historyCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  errorText: { color: '#D32F2F', marginBottom: 10, textAlign: 'center' },
  successText: { color: '#2E7D32', marginBottom: 10, fontWeight: '600' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF', paddingVertical: 12 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabText: { fontSize: 12, color: '#888', fontWeight: '600' },
  activeTabText: { color: '#B56576', fontWeight: '700' },
});
