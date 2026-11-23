import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient, imageUrl } from '../api/client';
import { CatalogProduct, RecommendResponse } from '../types';
import { Body, Button, Card, Chips, ErrorText, Field, Label, ProductImage, Screen, Title, styles } from '../components/ui';
import type { TKey } from '../i18n/translations';

const CATEGORIES = ['lip', 'foundation', 'mascara', 'sunscreen', 'moisturizer', 'serum'];

function CompactProductRow({
  product,
  onPress,
}: {
  product: CatalogProduct;
  onPress: () => void;
}) {
  const { c, t } = useApp();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: c.surface2,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
      }}
    >
      <ProductImage uri={imageUrl(product.image_url)} style={{ width: 56, height: 56, borderRadius: 10 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.between}>
          <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{product.brand}</Text>
          {product.price ? (
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800' }}>{product.price} TL</Text>
          ) : null}
        </View>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{product.product_name}</Text>
        <View style={styles.between}>
          <Text numberOfLines={1} style={{ color: c.muted, fontSize: 12, flex: 1 }}>
            {product.match_reason || `${product.rating.toFixed(1)} · ${Math.round(product.review_count / 100) / 10}k ${t('reviews')}`}
          </Text>
          {product.fit_score ? (
            <Text style={{ color: c.success, fontSize: 12, fontWeight: '700' }}>
              {product.fit_score}% {t('match')}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function DiscoverScreen({ onOpen }: { onOpen: (query: string) => void }) {
  const { c, t, lang, errorText } = useApp();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Daily Top 3
  const [daily, setDaily] = useState<RecommendResponse | null>(null);

  // Home Chatbot
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<RecommendResponse | null>(null);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    let active = true;
    apiClient
      .getDailyTop3(lang)
      .then((res) => active && setDaily(res))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [lang]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiClient
      .getCatalog(category === 'all' ? undefined : category)
      .then((items) => active && setProducts(items))
      .catch((e) => active && setError(errorText(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  const sendChat = async (textOverride?: string) => {
    const prompt = (textOverride ?? chatInput).trim();
    if (!prompt) return;
    setChatInput(prompt);
    setChatLoading(true);
    setChatError('');
    try {
      const res = await apiClient.chatRecommend(prompt, lang);
      setChatResult(res);
    } catch (e) {
      setChatError(errorText(e));
    } finally {
      setChatLoading(false);
    }
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? products.filter((p) => p.product_name.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle))
    : products;

  const options = [{ value: 'all', label: t('all') }, ...CATEGORIES.map((k) => ({ value: k, label: t(k as TKey) }))];
  const quickPrompts = [t('quickPrompt1'), t('quickPrompt2'), t('quickPrompt3')];

  return (
    <Screen>
      {/* 1. HOME CHATBOT CARD */}
      <Card>
        <Label>{t('chatTitle')}</Label>
        <Body>{chatResult ? chatResult.reply : t('chatGreeting')}</Body>

        <Field
          label=""
          placeholder={t('chatPlaceholder')}
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={() => sendChat()}
          returnKeyType="send"
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {quickPrompts.map((qp) => (
            <TouchableOpacity
              key={qp}
              onPress={() => sendChat(qp)}
              style={{
                backgroundColor: c.surface2,
                borderColor: c.border,
                borderWidth: 1,
                borderRadius: 16,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: c.muted, fontSize: 12 }}>{qp}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ErrorText message={chatError} />
        <Button title={t('send')} onPress={() => sendChat()} loading={chatLoading} />

        {chatResult && chatResult.products.length > 0 && (
          <View style={{ gap: 8, paddingTop: 4 }}>
            {chatResult.products.map((p) => (
              <CompactProductRow key={p.product_name} product={p} onPress={() => onOpen(p.product_name)} />
            ))}
          </View>
        )}
      </Card>

      {/* 2. DASHBOARD: TODAY'S TOP 3 PICKS */}
      {daily && daily.products.length > 0 && (
        <Card>
          <Label>{t('dailyTop3')}</Label>
          <View style={{ gap: 8 }}>
            {daily.products.map((p) => (
              <CompactProductRow key={p.product_name} product={p} onPress={() => onOpen(p.product_name)} />
            ))}
          </View>
        </Card>
      )}

      {/* 3. CATALOG SEARCH & GRID WITH PRICES */}
      <Title>{t('catalogTitle')}</Title>

      <Field
        label=""
        placeholder={t('searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => query.trim() && onOpen(query.trim())}
        returnKeyType="search"
      />
      {query.trim().length > 0 && <Button title={t('analyze')} onPress={() => onOpen(query.trim())} />}
      <Chips options={options} selected={[category]} onToggle={setCategory} scroll />
      <ErrorText message={error} />

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 24 }} />
      ) : visible.length === 0 ? (
        <Body muted>{t('noProducts')}</Body>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {visible.map((p) => (
            <TouchableOpacity
              key={p.product_name}
              activeOpacity={0.85}
              onPress={() => onOpen(p.product_name)}
              style={{ width: '48%', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}
            >
              <ProductImage uri={imageUrl(p.image_url)} style={{ width: '100%', aspectRatio: 1 }} />
              <View style={{ padding: 12, gap: 4 }}>
                <View style={styles.between}>
                  <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{p.brand}</Text>
                  {p.price ? <Text style={{ color: c.accent, fontSize: 12, fontWeight: '800' }}>{p.price} TL</Text> : null}
                </View>
                <Text numberOfLines={2} style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{p.product_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {p.shade_hex ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: p.shade_hex }} /> : null}
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    {p.rating.toFixed(1)} · {Math.round(p.review_count / 100) / 10}k {t('reviews')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Screen>
  );
}
