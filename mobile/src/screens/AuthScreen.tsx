import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { storage } from '../storage';
import { Button, Card, ErrorText, Field, Screen, styles } from '../components/ui';

const DEMO_EMAIL = 'demo@mira.app';
const DEMO_PASS = 'mira1234';

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
  const savedEmail = storage.get('last_email');
  const initialEmail = savedEmail || DEMO_EMAIL;
  const initialPassword = !savedEmail || savedEmail === DEMO_EMAIL ? DEMO_PASS : '';

  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    const nextRegister = !register;
    setRegister(nextRegister);
    setError('');
    if (nextRegister && email === DEMO_EMAIL) {
      setEmail('');
      setPassword('');
    } else if (!nextRegister && !email) {
      setEmail(initialEmail);
      setPassword(initialPassword);
    }
  };

  const fillDemo = () => {
    setRegister(false);
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError('');
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('errRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cleanEmail = email.trim();
      if (register) await apiClient.register(cleanEmail, password);
      else await apiClient.login(cleanEmail, password);
      storage.set('last_email', cleanEmail);
      onSignedIn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  const showFillDemo = !register && (email.trim() !== DEMO_EMAIL || password !== DEMO_PASS);

  return (
    <Screen>
      <View style={{ alignItems: 'flex-end' }}>
        <LanguageSwitch />
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Text style={{ color: c.text, fontSize: 36, fontWeight: '800', letterSpacing: 8 }}>MIRA</Text>
      </View>
      <Card>
        <Field
          label={t('email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
        />
        <Field
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? 'new-password' : 'current-password'}
          textContentType={register ? 'newPassword' : 'password'}
          onSubmitEditing={submit}
        />
        <ErrorText message={error} />
        <Button title={register ? t('createAccount') : t('signIn')} onPress={submit} loading={loading} />
        {showFillDemo ? <Button title={t('fillDemo')} onPress={fillDemo} variant="ghost" /> : null}
      </Card>
      <TouchableOpacity onPress={toggleMode} style={{ alignItems: 'center' }}>
        <Text style={{ color: c.muted, fontSize: 13 }}>{register ? t('haveAccount') : t('noAccount')}</Text>
      </TouchableOpacity>
    </Screen>
  );
}
