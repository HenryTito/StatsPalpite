import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

type Props = {
  label?: string;
  value?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences';
  /** Adorno a direita do campo (icone, indicador de validacao). */
  right?: ReactNode;
  /** Mensagem de erro; tambem pinta a borda com a cor de perigo. */
  error?: string;
  /** Campos multilinha usam 72pt de altura, como a justificativa do palpite. */
  multiline?: boolean;
  editable?: boolean;
};

export function Field({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  right,
  error,
  multiline = false,
  editable = true,
}: Props) {
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.box, multiline && styles.boxMultiline, !!error && styles.boxError]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Campo somente de leitura que abre um seletor (data, time, busca). */
export function SelectField({
  label,
  value,
  placeholder,
  right,
  onPress,
}: {
  label?: string;
  value?: string;
  placeholder?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const filled = !!value;
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.box} onTouchEnd={onPress}>
        <Text style={[styles.input, !filled && styles.placeholder]}>{value ?? placeholder}</Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink2 },
  box: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: colors.sur2,
  },
  boxMultiline: { height: 72, alignItems: 'flex-start', paddingVertical: spacing.md },
  boxError: { borderColor: colors.dan },
  input: { flex: 1, fontSize: 14, color: colors.ink, padding: 0 },
  inputMultiline: { height: '100%', textAlignVertical: 'top' },
  placeholder: { color: colors.ink3 },
  error: { fontSize: 12, color: colors.dan },
});
