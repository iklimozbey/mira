import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient, imageUrl } from '../api/client';
import { CatalogProduct, RecommendResponse } from '../types';
import { Body, Button, Card, Chips, ErrorText, Field, Label, ProductImage, Screen, Title, styles } from '../components/ui';
import { LanguageSwitch } from './AuthScreen';
import type { TKey } from '../i18n/translations';

const CATEGORIES = ['lip', 'foundation', 'mascara', 'sunscreen', 'moisturizer', 'serum'];

function CompactProductRow({ product, onPress }: { product: CatalogProduct; onPress: () => void }) {
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
          {product.price ? <Text style={{ color: c.accent, fontSize: 13, fontWeight: '800' }}>{product.price} TL</Text> : null}
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

/** Chat answer card. The #1 pick gets a large photo, the others a medium one. */
function ChatPickCard({ product, large, onPress }: { product: CatalogProduct; large?: boolean; onPress: () => void }) {
  const { c, t } = useApp();
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        width: large ? '100%' : '48.5%',
        backgroundColor: c.surface,
        borderColor: large ? c.accent : c.border,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <ProductImage uri={imageUrl(product.image_url)} style={{ width: '100%', aspectRatio: large ? 1.15 : 1 }} />
      {product.fit_score ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: c.accent,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: c.onAccent, fontSize: 12, fontWeight: '800' }}>
            {product.fit_score}% {t('match')}
          </Text>
        </View>
      ) : null}
      <View style={{ padding: large ? 16 : 12, gap: 4 }}>
        <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{product.brand}</Text>
        <Text numberOfLines={large ? 3 : 2} style={{ color: c.text, fontSize: large ? 18 : 14, fontWeight: '700' }}>
          {product.product_name}
        </Text>
        {product.match_reason ? (
          <Text numberOfLines={2} style={{ color: c.muted, fontSize: large ? 13 : 12 }}>{product.match_reason}</Text>
        ) : null}
        {product.price ? (
          <Text style={{ color: c.accent, fontSize: large ? 20 : 15, fontWeight: '800', marginTop: 2 }}>{product.price} TL</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function DiscoverScreen({
  onOpen,
  onOpenProfile,
  onAddProduct,
  onSignIn,
}: {
  onOpen: (query: string) => void;
  onOpenProfile: () => void;
  onAddProduct: () => void;
  onSignIn?: () => void;
}) {
  const { c, t, lang, signedIn, errorText } = useApp();
  const { height } = useWindowDimensions();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [daily, setDaily] = useState<RecommendResponse | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<RecommendResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
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
    const timer = setTimeout(
      () => {
        setLoading(true);
        setError('');
        apiClient
          .getCatalog(category === 'all' ? undefined : category, query.trim() || undefined)
          .then((items) => active && setProducts(items))
          .catch((e) => active && setError(errorText(e)))
          .finally(() => active && setLoading(false));
      },
      query.trim() ? 350 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, query]);

  const sendChat = async (textOverride?: string) => {
    const prompt = (textOverride ?? chatInput).trim();
    if (!prompt) return;
    setChatInput(prompt);
    setChatLoading(true);
    setChatError('');
    setChatResult(null);
    try {
      const res = await apiClient.chatRecommend(prompt, lang, chatHistory);
      setChatResult(res);
      setChatHistory((prev) => [...prev.slice(-4), { role: 'user', text: prompt }, { role: 'assistant', text: res.reply }]);
    } catch (e) {
      setChatError(errorText(e));
    } finally {
      setChatLoading(false);
    }
  };

  const options = [{ value: 'all', label: t('all') }, ...CATEGORIES.map((k) => ({ value: k, label: t(k as TKey) }))];
  const quickPrompts = [t('quickPrompt1'), t('quickPrompt2'), t('quickPrompt3')];
  const picks = chatResult?.products ?? [];

  return (
    <Screen>
      {!signedIn && (
        <View style={styles.between}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: 5 }}>MIRA</Text>
          <View style={styles.row}>
            <LanguageSwitch />
            {onSignIn && (
              <TouchableOpacity
                onPress={onSignIn}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: c.onAccent, fontSize: 13, fontWeight: '700' }}>{t('signIn')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* CHATBOT HERO: fills most of the first screen */}
      <Card style={{ minHeight: Math.max(460, height * 0.68), padding: 18, gap: 16 }}>
        <Label>{t('chatTitle')}</Label>

        <Text
          style={{
            color: c.text,
            fontSize: chatResult ? 16 : 24,
            lineHeight: chatResult ? 22 : 32,
            fontWeight: chatResult ? '600' : '700',
          }}
        >
          {chatResult ? chatResult.reply : t('chatGreeting')}
        </Text>

        {chatLoading && <ActivityIndicator color={c.accent} style={{ marginVertical: 24 }} />}

        {picks.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <ChatPickCard product={picks[0]} large onPress={() => onOpen(picks[0].product_name)} />
            {picks.slice(1).map((p) => (
              <ChatPickCard key={p.product_name} product={p} onPress={() => onOpen(p.product_name)} />
            ))}
          </View>
        )}

        {chatResult && picks.length === 0 && !chatLoading && (
          <Button title={t('increaseBudget')} onPress={onOpenProfile} variant="ghost" />
        )}

        <View style={{ flex: 1 }} />

        {!chatResult && !chatLoading && (
          <View style={{ gap: 8 }}>
            {quickPrompts.map((qp) => (
              <TouchableOpacity
                key={qp}
                onPress={() => sendChat(qp)}
                style={{
                  backgroundColor: c.surface2,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ color: c.text, fontSize: 14 }}>{qp}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ErrorText message={chatError} />
        <Field
          label=""
          placeholder={t('chatPlaceholder')}
          value={chatInput}
          onChangeText={setChatInput}
          onSubmitEditing={() => sendChat()}
          returnKeyType="send"
        />
        <Button title={t('send')} onPress={() => sendChat()} loading={chatLoading} />
      </Card>

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

      <View style={styles.between}>
        <Title>{t('catalogTitle')}</Title>
        {signedIn && (
          <TouchableOpacity onPress={onAddProduct}>
            <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>+ {t('addCatalogProduct')}</Text>
          </TouchableOpacity>
        )}
      </View>

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
      ) : products.length === 0 ? (
        <Body muted>{t('noProducts')}</Body>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {products.map((p) => (
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
