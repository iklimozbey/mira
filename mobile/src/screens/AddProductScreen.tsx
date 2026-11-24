import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient, imageUrl } from '../api/client';
import { Body, Button, Card, Chips, ErrorText, Field, Label, ProductImage, Screen, Title } from '../components/ui';
import type { TKey } from '../i18n/translations';

const CATEGORIES = ['lip', 'foundation', 'mascara', 'sunscreen', 'moisturizer', 'serum', 'other'];
const FINISHES = ['natural', 'matte', 'satin', 'glossy', 'dewy'];

function pickWebImage(): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(typeof reader.result === 'string' ? reader.result : null);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(null);
        img.src = typeof reader.result === 'string' ? reader.result : '';
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export function AddProductScreen({ onBack, onAdded }: { onBack: () => void; onAdded: (productName: string) => void }) {
  const { c, t, errorText } = useApp();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('serum');
  const [finish, setFinish] = useState('natural');
  const [priceText, setPriceText] = useState('');
  const [photo, setPhoto] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [merchantUrl, setMerchantUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedName, setSavedName] = useState('');

  const handlePickPhoto = async () => {
    const dataUrl = await pickWebImage();
    if (dataUrl) {
      setPhoto(dataUrl);
      setError('');
    }
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setPriceText('');
    setPhoto('');
    setMerchantName('');
    setMerchantUrl('');
    setSavedName('');
    setError('');
  };

  const submit = async () => {
    const cleanName = name.trim();
    const cleanBrand = brand.trim();
    const price = parseInt(priceText.replace(/\D/g, ''), 10);
    if (!cleanName || !cleanBrand) {
      setError(t('errRequired'));
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError(t('errPrice'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiClient.addCatalogProduct({
        product_name: cleanName,
        brand: cleanBrand,
        category,
        price,
        finish,
        image_url: photo.trim() || undefined,
        merchant_name: merchantName.trim() || undefined,
        merchant_url: merchantUrl.trim() || undefined,
      });
      setSavedName(saved.product_name);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const categoryOpts = CATEGORIES.map((k) => ({ value: k, label: t(k as TKey) }));
  const finishOpts = FINISHES.map((k) => ({ value: k, label: t(k as TKey) }));

  return (
    <Screen>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ color: c.accent, fontSize: 14, fontWeight: '700' }}>← {t('back')}</Text>
      </TouchableOpacity>

      <Title>{t('addCatalogProduct')}</Title>
      <Body muted>{t('addProductSubtitle')}</Body>

      {savedName ? (
        <Card>
          <Text style={{ color: c.success, fontSize: 15, fontWeight: '700' }}>{t('productAdded')}</Text>
          <Body>{savedName}</Body>
          <Button title={t('addAnother')} onPress={resetForm} />
          <Button title={t('back')} onPress={() => onAdded(savedName)} variant="ghost" />
        </Card>
      ) : (
        <Card>
          <Field label={t('productName')} value={name} onChangeText={setName} placeholder="The Purest Solutions Niacinamide 5% Serum" />
          <Field label={t('brand')} value={brand} onChangeText={setBrand} placeholder="The Purest Solutions" />

          <Label>{t('category')}</Label>
          <Chips options={categoryOpts} selected={[category]} onToggle={setCategory} />

          <Label>{t('finishLabel')}</Label>
          <Chips options={finishOpts} selected={[finish]} onToggle={setFinish} />

          <Field label={t('priceTl')} value={priceText} onChangeText={setPriceText} keyboardType="numeric" placeholder="349" />

          <Field
            label={t('photoUrl')}
            value={photo.startsWith('data:image/') ? '' : photo}
            onChangeText={setPhoto}
            placeholder="https://..."
          />

          {Platform.OS === 'web' && (
            <Button title={t('choosePhoto')} onPress={handlePickPhoto} variant="ghost" />
          )}

          {photo.trim().length > 0 && (
            <ProductImage uri={imageUrl(photo.trim())} style={{ width: '100%', height: 200, borderRadius: 12 }} />
          )}

          <Field label={t('storeName')} value={merchantName} onChangeText={setMerchantName} placeholder="Gratis / Trendyol / Sephora" />
          <Field label={t('storeUrl')} value={merchantUrl} onChangeText={setMerchantUrl} placeholder="https://..." />

          <ErrorText message={error} />
          <Button title={t('save')} onPress={submit} loading={saving} />
        </Card>
      )}
    </Screen>
  );
}
