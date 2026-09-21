import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../core/theme';
import { Badge, BadgeTone, Card, Screen, TopBar } from '../../core/ui';
import { palpitesEncerrados, palpitesPendentes } from '../../infrastructure/fixtures/palpites';
import type { Palpite } from '../../modules/palpites/domain/Palpite';

type Aba = 'pendentes' | 'encerrados';

/** Selo de status exibido no canto superior direito de cada palpite. */
function statusBadge(palpite: Palpite): { label: string; tone: BadgeTone } {
  switch (palpite.status) {
    case 'aguardando':
      return { label: 'Aguardando', tone: 'warn' };
    case 'acertou':
      return { label: `+${palpite.pontosGanhos} pts`, tone: 'accent' };
    case 'errou':
      return { label: `${palpite.pontosGanhos ?? 0} pts`, tone: 'danger' };
    case 'pendente-envio':
      return { label: 'Palpite pendente de envio', tone: 'neutral' };
  }
}

export function MeusPalpitesScreen() {
  const [aba, setAba] = useState<Aba>('pendentes');
  const lista = aba === 'pendentes' ? palpitesPendentes : palpitesEncerrados;

  return (
    <Screen
      header={
        <>
          <TopBar title="Meus palpites" variant="large" />
          <View style={styles.tabs}>
            {(['pendentes', 'encerrados'] as Aba[]).map((item) => {
              const ativa = item === aba;
              return (
                <Pressable
                  key={item}
                  onPress={() => setAba(item)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                  style={[styles.tab, ativa && styles.tabActive]}
                >
                  <Text style={[styles.tabLabel, ativa && styles.tabLabelActive]}>
                    {item === 'pendentes' ? 'Pendentes' : 'Encerrados'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      }
      contentStyle={styles.content}
    >
      {lista.map((palpite) => {
        const badge = statusBadge(palpite);
        return (
          <Card key={palpite.id}>
            <View style={styles.header}>
              <Text style={styles.when}>{palpite.quando}</Text>
              <Badge label={badge.label} tone={badge.tone} />
            </View>
            <Text style={styles.match}>{palpite.partida}</Text>
            <Text style={styles.detail}>
              Palpite: {palpite.escolhaRotulo} · {palpite.pontosApostados} pts
            </Text>
            {palpite.status === 'aguardando' ? (
              <Text style={styles.cancel}>Cancelar palpite</Text>
            ) : null}
            {palpite.status === 'acertou' ? (
              <Badge label="Acertou o vencedor" style={styles.result} />
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.bd },
  tab: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.acc },
  tabLabel: { fontSize: 14, color: colors.ink2 },
  tabLabelActive: { color: colors.acc, fontWeight: '600' },
  content: { paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  when: { fontSize: 12, color: colors.ink3 },
  match: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 10 },
  detail: { fontSize: 13, color: colors.ink2, marginTop: 4 },
  cancel: { fontSize: 13, color: colors.dan, fontWeight: '600', marginTop: 10 },
  result: { marginTop: 10 },
});
