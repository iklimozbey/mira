import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { Button, Card, ErrorText, Field, Screen, styles } from '../components/ui';

export function LanguageSwitch() {
  const { c, lang, setLang } = useApp();
  return (
    <View style={styles.row}>
      {(['en', 'tr'] as const).map((l) => (
        <TouchableOpacity key={l} onPress={() => setLang(l)}>
          <Text style={{ color: lang === l ? c.accent : c.muted, fontWeight: '700', fontSize: 13 }}>{l.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function AuthScreen() {
  const { c, t, errorText, onSignedIn } = useApp();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('errRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (register) await apiClient.register(email.trim(), password);
      else await apiClient.login(email.trim(), password);
      onSignedIn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'flex-end' }}>
        <LanguageSwitch />
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Text style={{ color: c.text, fontSize: 36, fontWeight: '800', letterSpacing: 8 }}>MIRA</Text>
      </View>
      <Card>
        <Field label={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <Field label={t('password')} value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={submit} />
        <ErrorText message={error} />
        <Button title={register ? t('createAccount') : t('signIn')} onPress={submit} loading={loading} />
      </Card>
      <TouchableOpacity onPress={() => { setRegister(!register); setError(''); }} style={{ alignItems: 'center' }}>
        <Text style={{ color: c.muted, fontSize: 13 }}>{register ? t('haveAccount') : t('noAccount')}</Text>
      </TouchableOpacity>
    </Screen>
  );
}
