import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { InventoryItem } from '../types';
import { Body, Button, Card, Chips, ErrorText, Field, Label, Screen, Title, styles } from '../components/ui';
import type { TKey } from '../i18n/translations';

const CATEGORIES = ['lip', 'foundation', 'mascara', 'sunscreen', 'moisturizer', 'serum', 'other'];
const STATUSES = ['owned', 'tested', 'wishlist'];

export function ShelfScreen() {
  const { c, t, errorText } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('other');
  const [status, setStatus] = useState('owned');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiClient.getInventory().then(setItems).catch((e) => setError(errorText(e)));
  }, []);

  useEffect(load, [load]);

  const add = async () => {
    if (!name.trim()) {
      setError(t('errRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiClient.addInventoryItem({ product_name: name.trim(), brand: brand.trim() || undefined, category, status });
      setName('');
      setBrand('');
      load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiClient.deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(errorText(e));
    }
  };

  return (
    <Screen>
      <Title>{t('shelfTitle')}</Title>

      <Card>
        <Label>{t('addProduct')}</Label>
        <Field label={t('productName')} value={name} onChangeText={setName} autoCapitalize="sentences" />
        <Field label={t('brand')} value={brand} onChangeText={setBrand} autoCapitalize="words" />
        <Label>{t('category')}</Label>
        <Chips options={CATEGORIES.map((k) => ({ value: k, label: t(k as TKey) }))} selected={[category]} onToggle={setCategory} />
        <Label>{t('status')}</Label>
        <Chips options={STATUSES.map((k) => ({ value: k, label: t(k as TKey) }))} selected={[status]} onToggle={setStatus} />
        <ErrorText message={error} />
        <Button title={t('addProduct')} onPress={add} loading={saving} />
      </Card>

      {items.length === 0 ? (
        <Body muted>{t('shelfEmpty')}</Body>
      ) : (
        items.map((item) => (
          <Card key={item.id} style={{ gap: 8 }}>
            <View style={styles.between}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{item.product_name}</Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>
                  {[item.brand, item.category ? t(item.category as TKey) : '', t(item.status as TKey)].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Button title={t('remove')} variant="danger" onPress={() => remove(item.id)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
