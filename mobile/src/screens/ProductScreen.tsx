import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { ResearchReport } from '../types';
import { Body, Button, Card, ErrorText, Label, Screen, Title } from '../components/ui';
import type { TKey } from '../i18n/translations';

function BulletList({ items, color }: { items: string[]; color: string }) {
  const { c } = useApp();
  return (
    <View style={{ gap: 8 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginTop: 7 }} />
          <Text style={{ color: c.text, fontSize: 14, lineHeight: 20, flex: 1 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProductScreen({ query, onBack, onQuery }: { query: string; onBack: () => void; onQuery: (q: string) => void }) {
  const { c, t, lang, errorText } = useApp();
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setReport(null);
    setAdded(false);
    apiClient
      .analyze(query, lang)
      .then((r) => active && setReport(r))
      .catch((e) => active && setError(errorText(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, lang]);

  const addToShelf = async () => {
    try {
      await apiClient.addInventoryItem({ product_name: report?.product_name || query, status: 'wishlist' });
      setAdded(true);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const verdict = report?.reality_check_verdict || '';
  const verdictColor = verdict === 'BUY' ? c.success : verdict === 'SKIP' ? c.danger : c.warn;
  const score = report?.suitability_score;

  return (
    <Screen>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ color: c.accent, fontWeight: '700', fontSize: 14 }}>{t('back')}</Text>
      </TouchableOpacity>

      {loading && (
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 40 }}>
          <ActivityIndicator color={c.accent} />
          <Body muted>{t('analyzing')}</Body>
        </View>
      )}

      <ErrorText message={error} />

      {report?.mode === 'suggestions' && (
        <Card>
          <Label>{t('suggestions')}</Label>
          {(report.suggested_products || []).map((p) => (
            <TouchableOpacity key={p.product_name} onPress={() => onQuery(p.product_name)} style={{ paddingVertical: 6 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{p.product_name}</Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>{p.brand}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {report && report.mode !== 'suggestions' && (
        <>
          <Title>{report.product_name || query}</Title>

          <Card>
            <Label>{t('fitScore')}</Label>
            <Text style={{ color: c.accent, fontSize: 40, fontWeight: '800' }}>{score ?? '-'}<Text style={{ color: c.muted, fontSize: 16 }}>/100</Text></Text>
            {report.suitability_reason ? <Body muted>{report.suitability_reason}</Body> : null}
          </Card>

          <Card>
            <Label>{t('verdict')}</Label>
            <Text style={{ color: verdictColor, fontSize: 20, fontWeight: '800' }}>
              {t((verdict in { BUY: 1, CONSIDER: 1, SKIP: 1, REDUNDANT: 1 } ? verdict : 'CONSIDER') as TKey)}
            </Text>
            {report.reality_check_reason ? <Body muted>{report.reality_check_reason}</Body> : null}
          </Card>

          {(report.pros?.length ?? 0) > 0 && (
            <Card>
              <Label>{t('pros')}</Label>
              <BulletList items={report.pros!} color={c.success} />
            </Card>
          )}
          {(report.cons?.length ?? 0) > 0 && (
            <Card>
              <Label>{t('cons')}</Label>
              <BulletList items={report.cons!} color={c.warn} />
            </Card>
          )}
          {(report.clinical_warnings?.length ?? 0) > 0 && (
            <Card>
              <Label>{t('warnings')}</Label>
              <BulletList items={report.clinical_warnings!} color={c.danger} />
            </Card>
          )}
          {(report.sources?.length ?? 0) > 0 && (
            <Card>
              <Label>{t('sources')}</Label>
              {report.sources!.map((s, i) => (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(s.url)}>
                  <Text numberOfLines={1} style={{ color: c.accent, fontSize: 13 }}>{s.title || s.url}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          <Button title={added ? t('addedToShelf') : t('addToShelf')} onPress={addToShelf} disabled={added} />
        </>
      )}
    </Screen>
  );
}
