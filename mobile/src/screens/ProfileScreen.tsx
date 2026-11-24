import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { QuotaInfo, UserProfile } from '../types';
import { Button, Card, Chips, ErrorText, Field, Label, Screen, Title } from '../components/ui';
import type { TKey } from '../i18n/translations';

const opts = (keys: string[], t: (k: TKey) => string) => keys.map((k) => ({ value: k, label: t(k as TKey) }));
const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function ProfileScreen({ onAddProduct }: { onAddProduct?: () => void }) {
  const { c, t, lang, setLang, mode, setMode, errorText, signOut } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgetText, setBudgetText] = useState('');
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient
      .getProfile()
      .then((p) => {
        setProfile(p);
        setBudgetText(p.budget_max ? String(p.budget_max) : '');
      })
      .catch((e) => setError(errorText(e)));
    apiClient.getQuota().then(setQuota).catch(() => {});
  }, []);

  const update = (patch: Partial<UserProfile>) => {
    setSaved(false);
    setProfile((p) => (p ? { ...p, ...patch } : p));
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    const parsedBudget = parseInt(budgetText.replace(/\D/g, ''), 10);
    try {
      await apiClient.updateProfile({
        skin_type: profile.skin_type,
        skin_undertone: profile.skin_undertone,
        skin_concerns: profile.skin_concerns,
        allergies_sensitivities: profile.allergies_sensitivities,
        budget_max: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : null,
      });
      setSaved(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Title>{t('tabProfile')}</Title>

      {profile && (
        <Card>
          <Label>{t('skinProfile')}</Label>

          <Label>{t('skinType')}</Label>
          <Chips options={opts(['oily', 'dry', 'combination', 'sensitive', 'normal'], t)} selected={profile.skin_type ? [profile.skin_type] : []} onToggle={(v) => update({ skin_type: v })} />

          <Label>{t('undertone')}</Label>
          <Chips options={opts(['warm', 'cool', 'neutral'], t)} selected={profile.skin_undertone ? [profile.skin_undertone] : []} onToggle={(v) => update({ skin_undertone: v })} />

          <Label>{t('concerns')}</Label>
          <Chips options={opts(['acne', 'rosacea', 'redness', 'pores', 'fungal_acne', 'eczema'], t)} selected={profile.skin_concerns} onToggle={(v) => update({ skin_concerns: toggle(profile.skin_concerns, v) })} />

          <Label>{t('sensitivities')}</Label>
          <Chips options={opts(['fragrance', 'alcohol', 'essential_oils', 'silicone'], t)} selected={profile.allergies_sensitivities} onToggle={(v) => update({ allergies_sensitivities: toggle(profile.allergies_sensitivities, v) })} />

          <Field
            label={t('budget')}
            placeholder={t('budgetPlaceholder')}
            value={budgetText}
            onChangeText={(v) => {
              setSaved(false);
              setBudgetText(v);
            }}
            keyboardType="numeric"
          />

          <ErrorText message={error} />
          <Button title={saved ? t('saved') : t('save')} onPress={save} loading={saving} />
        </Card>
      )}
      {!profile && <ErrorText message={error} />}

      <Card>
        <Label>{t('settings')}</Label>

        <Label>{t('language')}</Label>
        <Chips options={[{ value: 'en', label: 'English' }, { value: 'tr', label: 'Türkçe' }]} selected={[lang]} onToggle={(v) => setLang(v as 'en' | 'tr')} />

        <Label>{t('theme')}</Label>
        <Chips options={opts(['dark', 'light'], t)} selected={[mode]} onToggle={(v) => setMode(v as 'dark' | 'light')} />

        {quota && (
          <Text style={{ color: c.muted, fontSize: 13 }}>
            {t('analysesLeft')}: {quota.daily_limit >= 999 ? t('unlimited') : quota.remaining_today}
          </Text>
        )}
      </Card>

      {onAddProduct && <Button title={t('addCatalogProduct')} variant="ghost" onPress={onAddProduct} />}
      <Button title={t('signOut')} variant="ghost" onPress={signOut} />
    </Screen>
  );
}
