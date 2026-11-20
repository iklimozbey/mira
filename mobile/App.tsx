import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

const HERO_LIPSTICK_IMG = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80';
const AMBER_JAR_IMG = 'https://images.unsplash.com/photo-1608248597359-53b3b4d249f3?w=800&auto=format&fit=crop&q=80';
const USER_AVATAR_IMG = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
const SERUM_DROPPER_IMG = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80';

type StitchTab = 'explore' | 'diagnostic' | 'scan' | 'inventory' | 'atelier';

export default function App() {
  const [activeTab, setActiveTab] = useState<StitchTab>('explore');
  const [activeRoutineFilter, setActiveRoutineFilter] = useState<'sabah' | 'aksam' | 'arsiv'>('sabah');
  const [activeLoginTab, setActiveLoginTab] = useState<'login' | 'invite'>('login');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <Text style={styles.brandSubtitle}>MIRA Clinical Atelier</Text>
        <View style={styles.topHeaderRight}>
          <View style={styles.logoTextCol}>
            <Text style={styles.miraLogoTitle}>MIRA</Text>
            <Text style={styles.miraLogoSub}>CLINICAL ATELIER</Text>
          </View>
          <View style={styles.dashedAvatarRing}>
            <Text style={styles.dashedIcon}>ID</Text>
          </View>
          <Image source={{ uri: USER_AVATAR_IMG }} style={styles.userAvatarImg} />
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* TAB 1: KEŞFET */}
        {activeTab === 'explore' && (
          <View style={styles.screenWrapper}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.goldOverline}>KİŞİSEL KONSÜLTASYON</Text>
                <Text style={styles.greetingTitle}>İyi Akşamlar, Sayın Alara</Text>
              </View>
              <View style={styles.barrierPill}>
                <View style={styles.greenDot} />
                <Text style={styles.barrierText}>Bariyer Aktif</Text>
              </View>
            </View>

            {/* Cilt Bariyeri İndeksi - Kompakt Form Düzeni */}
            <View style={styles.card}>
              <View style={styles.barrierCardHeader}>
                <View style={styles.barrierScoreRow}>
                  <View style={styles.donutCircle}>
                    <Text style={styles.donutScoreText}>89</Text>
                  </View>
                  <View style={styles.barrierScoreTextCol}>
                    <Text style={styles.barrierIndexLabel}>CİLT BARİYERİ İNDEKSİ</Text>
                    <View style={styles.optimalRow}>
                      <Text style={styles.optimalText}>89/100 · Optimal Denge</Text>
                      <Text style={styles.greenCheck}>✓</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.circleChevronBtn}
                  onPress={() => setActiveTab('diagnostic')}
                >
                  <Text style={styles.chevronText}>›</Text>
                </TouchableOpacity>
              </View>

              {/* 3 Kompakt Form Kutusu */}
              <View style={styles.formTilesRow}>
                <View style={styles.formTile}>
                  <Text style={styles.formTileLabel}>Hidrasyon</Text>
                  <Text style={styles.formTileVal}>92%</Text>
                </View>
                <View style={styles.formTile}>
                  <Text style={styles.formTileLabel}>Sebum</Text>
                  <Text style={styles.formTileVal}>Dengeli</Text>
                </View>
                <View style={styles.formTile}>
                  <Text style={styles.formTileLabel}>Hassasiyet</Text>
                  <Text style={[styles.formTileVal, { color: '#34D399' }]}>Düşük</Text>
                </View>
              </View>
            </View>

            {/* Velvet Couture Hero Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.heroProductCard}
              onPress={() => setActiveTab('diagnostic')}
            >
              <View style={styles.curatorBadge}>
                <Text style={styles.curatorBadgeText}>KÜRATÖR SEÇİMİ</Text>
              </View>
              <Image source={{ uri: HERO_LIPSTICK_IMG }} style={styles.heroPackshotImage} />
              
              <View style={styles.heroFooter}>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMetaText}>HAUTE FORMULATION 2025</Text>
                  <Text style={styles.heroMetaText}>Atelier No. 04</Text>
                </View>
                <Text style={styles.heroProductTitle}>Velvet Couture</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ==============================================================
            TAB 2: TEŞHİS - KOMPAKT FORM ŞEKLİNDE
            No more wide stretched lines! Compact Form Card with 2x2 Form Tiles!
            ============================================================== */}
        {(activeTab === 'diagnostic' || activeTab === 'scan') && (
          <View style={styles.screenWrapper}>
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryPill}>
                <View style={[styles.greenDot, { backgroundColor: '#34D399' }]} />
                <Text style={styles.telemetryText}>CANLI TELEMETRİ</Text>
              </View>
              <Text style={styles.timeText}>Son Analiz: Bugün 14:20</Text>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.screenMainTitle}>Klinik Teşhis Matrisi</Text>
              <Text style={styles.screenSubTitle}>Dermatolojik Biyometri & Formülasyon Uyumu</Text>
            </View>

            <View style={styles.scanBanner}>
              <View style={styles.csvBlock}>
                <View style={styles.csvIcon}>
                  <Text style={styles.csvText}>CSV</Text>
                </View>
                <View>
                  <Text style={styles.scanTitle}>Cilt Taramasın</Text>
                  <Text style={styles.scanSub}>Mikro-hücresel optik analiz</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.pinkBtnSmall} onPress={() => setActiveTab('diagnostic')}>
                <Text style={styles.pinkBtnSmallText}>YENİ TARA</Text>
              </TouchableOpacity>
            </View>

            {/* BİYOMETRİK SAĞLIK FORMU: 2x2 KOMPAKT FORM KUTULARI */}
            <View style={styles.card}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryOverline}>BİYOMETRİK SAĞLIK FORMU</Text>
                <View style={styles.highCalibPill}>
                  <Text style={styles.highCalibText}>Klinik Kalibrasyon: Yüksek</Text>
                </View>
              </View>

              {/* Kompakt Form Başlık Kartı: %92 Donut */}
              <View style={styles.formHeaderCard}>
                <View style={styles.formDonut}>
                  <Text style={styles.formDonutOverline}>GENEL SKOR</Text>
                  <Text style={styles.formDonutNumber}>%92</Text>
                  <Text style={styles.formDonutSub}>Mükemmel</Text>
                </View>
                <View style={styles.formHeaderCol}>
                  <Text style={styles.formHeaderTitle}>Optimal Biyometrik Denge</Text>
                  <Text style={styles.formHeaderDesc}>
                    Dermal hidrasyon katsayısı optimum düzeyde. Transepidermal su kaybı (TEWL) minimum eşikte.
                  </Text>
                </View>
              </View>

              {/* 2x2 Form Izgarası: Her metrik kendi kutucuğunda! */}
              <View style={styles.formSectionWrapper}>
                <Text style={styles.formSectionLabel}>BİYOMETRİK PARAMETRELER</Text>
                
                <View style={styles.formGrid2x2}>
                  {/* Kutucuk 1: Sebum */}
                  <View style={styles.metricFormBox}>
                    <View style={styles.boxTopRow}>
                      <Text style={styles.boxLabel}>Sebum</Text>
                      <Text style={[styles.boxVal, { color: '#E298A6' }]}>%42</Text>
                    </View>
                    <View style={styles.boxBarTrack}>
                      <View style={[styles.boxBarFill, { width: '42%', backgroundColor: '#E298A6' }]} />
                    </View>
                    <Text style={styles.boxSub}>Dengeli Salgılama</Text>
                  </View>

                  {/* Kutucuk 2: Nem Tutma */}
                  <View style={styles.metricFormBox}>
                    <View style={styles.boxTopRow}>
                      <Text style={styles.boxLabel}>Nem Tutma</Text>
                      <Text style={[styles.boxVal, { color: '#34D399' }]}>%88</Text>
                    </View>
                    <View style={styles.boxBarTrack}>
                      <View style={[styles.boxBarFill, { width: '88%', backgroundColor: '#34D399' }]} />
                    </View>
                    <Text style={[styles.boxSub, { color: '#34D399' }]}>Yüksek Hidrasyon</Text>
                  </View>

                  {/* Kutucuk 3: Bariyer Direnci */}
                  <View style={styles.metricFormBox}>
                    <View style={styles.boxTopRow}>
                      <Text style={styles.boxLabel}>Bariyer</Text>
                      <Text style={[styles.boxVal, { color: '#E298A6' }]}>%94</Text>
                    </View>
                    <View style={styles.boxBarTrack}>
                      <View style={[styles.boxBarFill, { width: '94%', backgroundColor: '#E298A6' }]} />
                    </View>
                    <Text style={styles.boxSub}>Güçlü Kalkan</Text>
                  </View>

                  {/* Kutucuk 4: Gözenek */}
                  <View style={styles.metricFormBox}>
                    <View style={styles.boxTopRow}>
                      <Text style={styles.boxLabel}>Gözenek</Text>
                      <Text style={[styles.boxVal, { color: '#D1D5DB' }]}>%90</Text>
                    </View>
                    <View style={styles.boxBarTrack}>
                      <View style={[styles.boxBarFill, { width: '90%', backgroundColor: '#9CA3AF' }]} />
                    </View>
                    <Text style={styles.boxSub}>Açık & Sağlıklı</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: ENVANTER */}
        {activeTab === 'inventory' && (
          <View style={styles.screenWrapper}>
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryPill}>
                <View style={[styles.greenDot, { backgroundColor: '#E298A6' }]} />
                <Text style={[styles.telemetryText, { color: '#E298A6' }]}>DERMATOLOJİK FORMÜLASYON KASASI</Text>
              </View>
              <Text style={styles.timeText}>v3.4 Senkronize</Text>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.screenMainTitle}>Klinik Envanterim & Günlük Rutin Kasası</Text>
              <Text style={styles.screenSubTitle}>Cilt bariyeri biyometrisi ile doğrulanmış kozmetik kompozisyonu.</Text>
            </View>

            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                style={[styles.filterPill, activeRoutineFilter === 'sabah' && styles.filterPillActive]}
                onPress={() => setActiveRoutineFilter('sabah')}
              >
                <Text style={[styles.filterPillText, activeRoutineFilter === 'sabah' && styles.filterPillTextActive]}>
                  Sabah (3)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, activeRoutineFilter === 'aksam' && styles.filterPillActive]}
                onPress={() => setActiveRoutineFilter('aksam')}
              >
                <Text style={[styles.filterPillText, activeRoutineFilter === 'aksam' && styles.filterPillTextActive]}>
                  Akşam (4)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, activeRoutineFilter === 'arsiv' && styles.filterPillActive]}
                onPress={() => setActiveRoutineFilter('arsiv')}
              >
                <Text style={[styles.filterPillText, activeRoutineFilter === 'arsiv' && styles.filterPillTextActive]}>
                  Arşiv (12)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.compatibilityBanner}>
              <View style={styles.compatHeader}>
                <View style={styles.compatTitleGroup}>
                  <Text style={styles.compatCheck}>✓</Text>
                  <Text style={styles.compatTitle}>Bileşen Uyumu: Mükemmel</Text>
                </View>
                <View style={styles.zeroConflictBadge}>
                  <Text style={styles.zeroConflictText}>0 Çakışma</Text>
                </View>
              </View>
              <Text style={styles.compatDesc}>
                Envanterinizdeki ürünler arasında retinol + asit gibi birbiriyle çakışan veya bariyeri yoran hiçbir reaktif bileşen bulunmuyor.
              </Text>
            </View>

            <View style={styles.protocolHeader}>
              <Text style={styles.protocolTitle}>PROTOKOL SIRALAMASI · Kronolojik Emilim</Text>
              <Text style={styles.protocolBadge}>Sıra Korumalı</Text>
            </View>

            {/* Step 01 */}
            <View style={styles.protocolCard}>
              <View style={styles.stepCardTop}>
                <View style={styles.stepNumCol}>
                  <Text style={styles.stepNum}>01</Text>
                  <Text style={styles.stepCategory}>TEMİZLEYİCİ & TONİK</Text>
                </View>
                <Text style={styles.safetyScore}>Güvenlik Skoru 10/10</Text>
              </View>
              <View style={styles.stepBodyRow}>
                <View style={styles.phBox}>
                  <Text style={styles.phDrop}>💧</Text>
                  <Text style={styles.phText}>pH 5.5</Text>
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={styles.stepProdTitle}>Gentle Rose Cellular Cleanser</Text>
                  <Text style={styles.stepProdSub}>150ml · Hücresel Arındırıcı Formül</Text>
                  <Text style={styles.stepUsage}>Uygulama: Ilık su ile 60 saniye dairesel masaj</Text>
                </View>
              </View>
            </View>

            {/* Step 02 */}
            <View style={styles.protocolCard}>
              <View style={styles.stepCardTop}>
                <View style={styles.stepNumCol}>
                  <Text style={styles.stepNum}>02</Text>
                  <Text style={styles.stepCategory}>ONARICI KONSANTRE</Text>
                </View>
                <Text style={styles.comedogenicScore}>Komedojenik Risk: 0/5</Text>
              </View>
              <View style={styles.stepBodyRow}>
                <Image source={{ uri: SERUM_DROPPER_IMG }} style={styles.stepThumbImg} />
                <View style={styles.stepTextCol}>
                  <Text style={styles.stepProdTitle}>Aura Elixir Reparative Serum</Text>
                  <Text style={styles.stepProdSub}>30ml Amber Dropper · Peptit Konsantresi</Text>
                  <View style={styles.doseRow}>
                    <View style={styles.dosePill}>
                      <Text style={styles.dosePillText}>Doz: 3 Damla</Text>
                    </View>
                    <Text style={styles.warmText}>Avuç içi ısıtmalı</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 5: ATELİER */}
        {activeTab === 'atelier' && (
          <View style={styles.screenWrapper}>
            <View style={styles.atelierBrandBlock}>
              <Text style={styles.atelierOverline}>CLINICAL BEAUTY ATELIER</Text>
              <Text style={styles.atelierMainLogo}>MIRA</Text>
              <Text style={styles.atelierItalicTagline}>Zarafet ve Bilimin Kesişimi</Text>
            </View>

            <View style={styles.atelierBannerCard}>
              <Image source={{ uri: AMBER_JAR_IMG }} style={styles.atelierBannerImg} />
              <View style={styles.atelierBannerOverlay}>
                <View style={styles.atelierBannerRow}>
                  <View style={styles.diagActiveRow}>
                    <View style={styles.greenDot} />
                    <Text style={styles.diagActiveText}>KLİNİK TANI AĞI AKTİF</Text>
                  </View>
                  <Text style={styles.versionText}>v4.8 CLINIQUE</Text>
                </View>
              </View>
            </View>

            <View style={styles.segmentedLoginRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, activeLoginTab === 'login' && styles.segmentBtnActive]}
                onPress={() => setActiveLoginTab('login')}
              >
                <Text style={[styles.segmentBtnText, activeLoginTab === 'login' && styles.segmentBtnTextActive]}>
                  Üye Girişi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, activeLoginTab === 'invite' && styles.segmentBtnActive]}
                onPress={() => setActiveLoginTab('invite')}
              >
                <Text style={[styles.segmentBtnText, activeLoginTab === 'invite' && styles.segmentBtnTextActive]}>
                  Atelier Davetiyesi
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loginForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-POSTA VEYA ÜYELİK NO</Text>
                <TextInput
                  style={styles.textInput}
                  value="atelier.client@mira.clinic"
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.pwdLabelRow}>
                  <Text style={styles.inputLabel}>GÜVENLİK PAROLASI</Text>
                  <Text style={styles.forgotPwd}>Şifremi Unuttum</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value="•••••••••••••"
                  secureTextEntry
                  editable={false}
                />
              </View>

              <TouchableOpacity
                style={styles.pinkActionBtn}
                onPress={() => setActiveTab('explore')}
              >
                <Text style={styles.pinkActionBtnText}>ATELİER'YE GİRİŞ YAP →</Text>
              </TouchableOpacity>

              <View style={styles.orDividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>VEYA</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.faceIdBtn} onPress={() => setActiveTab('explore')}>
                <Text style={styles.faceIdText}>Face ID & Dermatolojik Profil ile Giriş</Text>
              </TouchableOpacity>

              <View style={styles.inviteCodeCard}>
                <View style={styles.inviteLeft}>
                  <View style={styles.keyIcon}>
                    <Text style={styles.keyEmoji}>🔑</Text>
                  </View>
                  <View>
                    <Text style={styles.inviteTitle}>Özel Atelier Davetiyesi</Text>
                    <Text style={styles.inviteSub}>Konsültasyon kodunuz mu var?</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.activateBtn}>
                  <Text style={styles.activateBtnText}>AKTİVE ET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* 5-PILL BOTTOM NAVIGATION */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabIcon, activeTab === 'explore' && styles.tabActiveIcon]}>✨</Text>
          <Text style={[styles.tabText, activeTab === 'explore' && styles.tabActiveText]}>KEŞFET</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setActiveTab('diagnostic')}
        >
          <Text style={[styles.tabIcon, activeTab === 'diagnostic' && styles.tabActiveIcon]}>📊</Text>
          <Text style={[styles.tabText, activeTab === 'diagnostic' && styles.tabActiveText]}>TEŞHİS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerAiScanBtnWrapper}
          onPress={() => setActiveTab('diagnostic')}
        >
          <View style={styles.centerAiScanBtn}>
            <Text style={styles.aiScanIcon}>⊙</Text>
          </View>
          <Text style={styles.aiScanLabel}>AI TARA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabIcon, activeTab === 'inventory' && styles.tabActiveIcon]}>📦</Text>
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabActiveText]}>ENVANTER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setActiveTab('atelier')}
        >
          <Text style={[styles.tabIcon, activeTab === 'atelier' && styles.tabActiveIcon]}>🌿</Text>
          <Text style={[styles.tabText, activeTab === 'atelier' && styles.tabActiveText]}>ATELİER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0C0E12',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoTextCol: {
    alignItems: 'flex-end',
  },
  miraLogoTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E298A6',
    letterSpacing: 2,
  },
  miraLogoSub: {
    fontSize: 7,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  dashedAvatarRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E298A6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedIcon: {
    fontSize: 9,
    color: '#E298A6',
    fontWeight: '800',
  },
  userAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  contentContainer: {
    flex: 1,
  },
  screenWrapper: {
    padding: 16,
    gap: 14,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goldOverline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#D4AF37',
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  barrierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#14171E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  barrierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  card: {
    backgroundColor: '#191C24',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  barrierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barrierScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donutCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#E298A6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  donutScoreText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E298A6',
  },
  barrierScoreTextCol: {
    gap: 2,
  },
  barrierIndexLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  optimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optimalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greenCheck: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: 'bold',
  },
  circleChevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: -2,
  },
  formTilesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  formTile: {
    flex: 1,
    backgroundColor: '#1E222C',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  formTileLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  formTileVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroProductCard: {
    backgroundColor: '#191C24',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  curatorBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  curatorBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#E5E7EB',
    letterSpacing: 1.5,
  },
  heroPackshotImage: {
    width: '100%',
    height: 260,
  },
  heroFooter: {
    padding: 16,
    backgroundColor: '#191C24',
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroMetaText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#9CA3AF',
  },
  heroProductTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#14171E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  telemetryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  titleBlock: {
    gap: 2,
  },
  screenMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  screenSubTitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  scanBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#191C24',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  csvBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  csvIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E298A6',
  },
  scanTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  pinkBtnSmall: {
    backgroundColor: '#E298A6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pinkBtnSmallText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0E1013',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryOverline: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  highCalibPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  highCalibText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
  },
  formHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E222C',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  formDonut: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E298A6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  formDonutOverline: {
    fontSize: 7,
    fontWeight: '900',
    color: '#9CA3AF',
  },
  formDonutNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  formDonutSub: {
    fontSize: 7,
    fontWeight: '800',
    color: '#E298A6',
  },
  formHeaderCol: {
    flex: 1,
    gap: 2,
  },
  formHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  formHeaderDesc: {
    fontSize: 10,
    color: '#D1D5DB',
    lineHeight: 14,
  },
  formSectionWrapper: {
    gap: 6,
  },
  formSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  formGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricFormBox: {
    width: '48.5%',
    backgroundColor: '#1E222C',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  boxTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  boxVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  boxBarTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  boxBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  boxSub: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#191C24',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterPillActive: {
    backgroundColor: '#E298A6',
    borderColor: '#E298A6',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  filterPillTextActive: {
    color: '#0E1013',
    fontWeight: '900',
  },
  compatibilityBanner: {
    backgroundColor: '#191C24',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    gap: 6,
  },
  compatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compatTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compatCheck: {
    fontSize: 14,
    color: '#34D399',
    fontWeight: 'bold',
  },
  compatTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
  },
  zeroConflictBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  zeroConflictText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
  },
  compatDesc: {
    fontSize: 11,
    color: '#D1D5DB',
    lineHeight: 15,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  protocolTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  protocolBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E298A6',
  },
  protocolCard: {
    backgroundColor: '#191C24',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  stepCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepNumCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepNum: {
    fontSize: 14,
    fontWeight: '900',
    color: '#E298A6',
  },
  stepCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5E7EB',
    letterSpacing: 1,
  },
  safetyScore: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  comedogenicScore: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  phBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phDrop: {
    fontSize: 15,
  },
  phText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#E298A6',
    marginTop: 2,
  },
  stepThumbImg: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  stepTextCol: {
    flex: 1,
    gap: 2,
  },
  stepProdTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepProdSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  stepUsage: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#D1D5DB',
    marginTop: 2,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dosePill: {
    backgroundColor: 'rgba(226, 152, 166, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 152, 166, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dosePillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E298A6',
  },
  warmText: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  atelierBrandBlock: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  atelierOverline: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#9CA3AF',
  },
  atelierMainLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  atelierItalicTagline: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#E298A6',
  },
  atelierBannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 125,
    position: 'relative',
  },
  atelierBannerImg: {
    width: '100%',
    height: '100%',
  },
  atelierBannerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  atelierBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  segmentedLoginRow: {
    flexDirection: 'row',
    backgroundColor: '#191C24',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#262A34',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  loginForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#9CA3AF',
  },
  pwdLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPwd: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E298A6',
  },
  textInput: {
    backgroundColor: '#1E222C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    color: '#FFFFFF',
  },
  pinkActionBtn: {
    backgroundColor: '#E298A6',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E298A6',
  },
  pinkActionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0E1013',
    letterSpacing: 1,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
  },
  faceIdBtn: {
    backgroundColor: '#191C24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  faceIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  inviteCodeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#191C24',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmoji: {
    fontSize: 13,
  },
  inviteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inviteSub: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  activateBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activateBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090A0D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  tabActiveIcon: {
    color: '#E298A6',
  },
  tabText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6B7280',
  },
  tabActiveText: {
    color: '#E298A6',
  },
  centerAiScanBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -16,
  },
  centerAiScanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E298A6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E298A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#16181F',
  },
  aiScanIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0E1013',
  },
  aiScanLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#E298A6',
    letterSpacing: 1,
    marginTop: 2,
  },
});
