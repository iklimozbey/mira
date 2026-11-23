import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { Body, Button, Card, Chips, ErrorText, Field, Label, Screen, Title } from '../components/ui';
import type { TKey } from '../i18n/translations';

const opts = (keys: string[], t: (k: TKey) => string) => keys.map((k) => ({ value: k, label: t(k as TKey) }));
const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { c, t, errorText } = useApp();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Skin & real numeric budget
  const [skinType, setSkinType] = useState('combination');
  const [undertone, setUndertone] = useState('neutral');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [sensitivities, setSensitivities] = useState<string[]>([]);
  const [budgetText, setBudgetText] = useState('600');

  // Step 2: Optional shelf products
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('other');
  const [addedList, setAddedList] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveStep1 = async () => {
    setSaving(true);
    setError('');
    const parsedBudget = parseInt(budgetText.replace(/\D/g, ''), 10);
    try {
      await apiClient.updateProfile({
        skin_type: skinType,
        skin_undertone: undertone,
        skin_concerns: concerns,
        allergies_sensitivities: sensitivities,
        budget_max: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : null,
      });
      setStep(2);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const addShelfProduct = async () => {
    if (!productName.trim()) {
      setError(t('errRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiClient.addInventoryItem({
        product_name: productName.trim(),
        brand: brand.trim() || undefined,
        category,
        status: 'owned',
      });
      setAddedList((prev) => [...prev, productName.trim()]);
      setProductName('');
      setBrand('');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    setError('');
    try {
      await apiClient.updateProfile({ onboarding_completed: true });
      onDone();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  if (step === 1) {
    return (
      <Screen>
        <Title>{t('onboardingTitle')}</Title>
        <Body muted>{t('onboardingSubtitle')}</Body>

        <Card>
          <Label>{t('skinType')}</Label>
          <Chips options={opts(['oily', 'dry', 'combination', 'sensitive', 'normal'], t)} selected={[skinType]} onToggle={setSkinType} />

          <Label>{t('undertone')}</Label>
          <Chips options={opts(['warm', 'cool', 'neutral'], t)} selected={[undertone]} onToggle={setUndertone} />

          <Label>{t('concerns')}</Label>
          <Chips options={opts(['acne', 'rosacea', 'redness', 'pores', 'fungal_acne', 'eczema'], t)} selected={concerns} onToggle={(v) => setConcerns(toggle(concerns, v))} />

          <Label>{t('sensitivities')}</Label>
          <Chips options={opts(['fragrance', 'alcohol', 'essential_oils', 'silicone'], t)} selected={sensitivities} onToggle={(v) => setSensitivities(toggle(sensitivities, v))} />

          <Field
            label={t('budget')}
            placeholder={t('budgetPlaceholder')}
            value={budgetText}
            onChangeText={setBudgetText}
            keyboardType="numeric"
          />

          <ErrorText message={error} />
          <Button title={t('onboardingNext')} onPress={saveStep1} loading={saving} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{t('onboardingShelfTitle')}</Title>
      <Body muted>{t('onboardingShelfSubtitle')}</Body>

      <Card>
        <Field label={t('productName')} value={productName} onChangeText={setProductName} autoCapitalize="sentences" />
        <Field label={t('brand')} value={brand} onChangeText={setBrand} autoCapitalize="words" />
        <Label>{t('category')}</Label>
        <Chips
          options={opts(['lip', 'foundation', 'mascara', 'sunscreen', 'moisturizer', 'serum', 'other'], t)}
          selected={[category]}
          onToggle={setCategory}
        />
        <ErrorText message={error} />
        <Button title={t('addProduct')} variant="ghost" onPress={addShelfProduct} loading={saving} />

        {addedList.length > 0 && (
          <View style={{ gap: 4, paddingTop: 4 }}>
            <Label>{`${t('addedCount')} (${addedList.length})`}</Label>
            {addedList.map((name, i) => (
              <Text key={i} style={{ color: c.text, fontSize: 13 }}>
                • {name}
              </Text>
            ))}
          </View>
        )}
      </Card>

      <Button title={t('finishSetup')} onPress={finish} loading={saving} />
      <Button title={t('skipForNow')} variant="ghost" onPress={finish} disabled={saving} />
    </Screen>
  );
}
