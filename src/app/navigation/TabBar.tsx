import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout } from '../../core/theme';
import { Icon, IconName } from '../../core/ui';

const icons: Record<string, IconName> = {
  Home: 'home',
  MeusPalpites: 'ticket',
  Ranking: 'trophy',
  Perfil: 'user',
};

const labels: Record<string, string> = {
  Home: 'Inicio',
  MeusPalpites: 'Meus palpites',
  Ranking: 'Ranking',
  Perfil: 'Perfil',
};

/** Barra inferior do design: 64pt, 4 itens, icone acentuado quando ativo. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { height: layout.tabBarHeight + insets.bottom, paddingBottom: insets.bottom },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={labels[route.name]}
            style={styles.item}
          >
            <Icon
              name={icons[route.name] ?? 'home'}
              size={24}
              color={focused ? colors.acc : colors.ink3}
              strokeWidth={focused ? 1.8 : 1.6}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.bd,
    backgroundColor: colors.sur,
  },
  item: { padding: 8 },
});
