import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useApp } from '../context/AppContext';

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useApp();
  return (
    <View style={[{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }, style]}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const { c } = useApp();
  return <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  const { c } = useApp();
  return <Text style={{ color: c.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 }}>{children}</Text>;
}

export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const { c } = useApp();
  return <Text style={{ color: muted ? c.muted : c.text, fontSize: 14, lineHeight: 20 }}>{children}</Text>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { c } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <TextInput
        placeholderTextColor={c.muted}
        autoCapitalize="none"
        {...props}
        style={{
          backgroundColor: c.surface2,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: c.text,
          fontSize: 15,
        }}
      />
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const { c } = useApp();
  const bg = variant === 'primary' ? c.accent : 'transparent';
  const fg = variant === 'primary' ? c.onAccent : variant === 'danger' ? c.danger : c.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        backgroundColor: bg,
        borderColor: variant === 'primary' ? c.accent : c.border,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: 15, fontWeight: '700' }}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function ErrorText({ message }: { message?: string }) {
  const { c } = useApp();
  return message ? <Text style={{ color: c.danger, fontSize: 13 }}>{message}</Text> : null;
}

export interface Option {
  value: string;
  label: string;
}

/** Row of selectable chips. Single or multi select. */
export function Chips({
  options,
  selected,
  onToggle,
  scroll,
}: {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  scroll?: boolean;
}) {
  const { c } = useApp();
  const items = options.map((o) => {
    const active = selected.includes(o.value);
    return (
      <TouchableOpacity
        key={o.value}
        onPress={() => onToggle(o.value)}
        activeOpacity={0.8}
        style={{
          backgroundColor: active ? c.accent : c.surface2,
          borderColor: active ? c.accent : c.border,
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: active ? c.onAccent : c.text, fontSize: 13, fontWeight: '600' }}>{o.label}</Text>
      </TouchableOpacity>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {items}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{items}</View>;
}

/** Product photo framed cleanly so real packshots (bottles, lipsticks) are never cropped. */
export function ProductImage({ uri, style }: { uri?: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useApp();
  const [failed, setFailed] = React.useState(false);
  if (!uri || failed) {
    return <View style={[{ backgroundColor: c.surface2 }, style]} />;
  }
  return (
    <View style={[{ backgroundColor: '#F5F2F3', overflow: 'hidden', padding: 4 }, style]}>
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        resizeMode="contain"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
});
