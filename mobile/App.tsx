import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { apiClient } from './src/api/client';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ProductScreen } from './src/screens/ProductScreen';
import { ShelfScreen } from './src/screens/ShelfScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AddProductScreen } from './src/screens/AddProductScreen';
import type { TKey } from './src/i18n/translations';

type Tab = 'discover' | 'shelf' | 'profile';
const TABS: { key: Tab; label: TKey }[] = [
  { key: 'discover', label: 'tabDiscover' },
  { key: 'shelf', label: 'tabShelf' },
  { key: 'profile', label: 'tabProfile' },
];

function Root() {
  const { c, t, mode, signedIn } = useApp();
  const [tab, setTab] = useState<Tab>('discover');
  const [query, setQuery] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!signedIn) {
      setNeedsOnboarding(null);
      return;
    }
    let active = true;
    apiClient
      .getProfile()
      .then((p) => {
        if (active) setNeedsOnboarding(!p.onboarding_completed);
      })
      .catch(() => {
        if (active) setNeedsOnboarding(false);
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  let content: React.ReactNode;
  if (!signedIn) {
    content = <AuthScreen />;
  } else if (needsOnboarding === null) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  } else if (needsOnboarding) {
    content = <OnboardingScreen onDone={() => setNeedsOnboarding(false)} />;
  } else if (addingProduct) {
    content = (
      <AddProductScreen
        onBack={() => setAddingProduct(false)}
        onAdded={() => {
          setAddingProduct(false);
          setTab('discover');
        }}
      />
    );
  } else if (query) {
    content = <ProductScreen query={query} onQuery={setQuery} onBack={() => setQuery(null)} />;
  } else if (tab === 'discover') {
    content = <DiscoverScreen onOpen={setQuery} onOpenProfile={() => setTab('profile')} onAddProduct={() => setAddingProduct(true)} />;
  } else if (tab === 'shelf') {
    content = <ShelfScreen />;
  } else {
    content = <ProfileScreen onAddProduct={() => setAddingProduct(true)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
        <View style={{ flex: 1 }}>{content}</View>
        {signedIn && needsOnboarding === false && (
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface }}>
            {TABS.map((item) => {
              const active = !query && !addingProduct && tab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => {
                    setQuery(null);
                    setAddingProduct(false);
                    setTab(item.key);
                  }}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderTopWidth: 2, borderTopColor: active ? c.accent : 'transparent', marginTop: -1 }}
                >
                  <Text style={{ color: active ? c.accent : c.muted, fontSize: 13, fontWeight: '700' }}>{t(item.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
