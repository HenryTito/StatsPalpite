import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from './Icon';
import { useI18n } from '../i18n';
import { colors, radius, spacing } from '../theme';

type Props = {
  /** Data no formato AAAA-MM-DD, ou null quando nenhuma foi escolhida. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  /** Rótulo lido por leitores de tela. */
  accessibilityLabel?: string;
};

/** Converte Date para AAAA-MM-DD sem passar por UTC, que erraria o dia. */
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Interpreta AAAA-MM-DD no fuso local; `new Date(texto)` assumiria UTC. */
function fromIsoDate(value: string | null): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

/**
 * Campo de data com o seletor nativo do sistema.
 *
 * Digitar a data à mão obrigava a pessoa a acertar os hífens — "20250201"
 * virava erro de validação, e o ícone de calendário ao lado prometia um
 * seletor que não existia. Com o seletor do sistema não há formato a errar:
 * a data escolhida é sempre válida.
 */
export function DateField({ value, onChange, placeholder, accessibilityLabel }: Props) {
  const { formatDate } = useI18n();
  const [aberto, setAberto] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        style={styles.campo}
      >
        <Text style={value ? styles.valor : styles.placeholder}>
          {value ? formatDate(fromIsoDate(value), { dateStyle: 'long' }) : placeholder}
        </Text>

        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Limpar data"
          >
            <Icon name="close" size={18} color={colors.ink3} />
          </Pressable>
        ) : (
          <Icon name="calendar" size={18} color={colors.ink3} />
        )}
      </Pressable>

      {aberto ? (
        <DateTimePicker
          value={fromIsoDate(value)}
          mode="date"
          display="default"
          // No Android o seletor é um diálogo: ele se fecha a cada evento.
          onValueChange={(_evento, selecionada) => {
            setAberto(false);
            if (selecionada) onChange(toIsoDate(selecionada));
          }}
          onDismiss={() => setAberto(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.bd,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: colors.sur2,
    gap: spacing.sm,
  },
  valor: { flex: 1, fontSize: 14, color: colors.ink },
  placeholder: { flex: 1, fontSize: 14, color: colors.ink3 },
});
