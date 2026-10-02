import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { TabBar } from './TabBar';
import { lazyScreen } from './lazy';
import type { RootStackParamList, TabParamList } from './types';
import { colors } from '../../core/theme';
import { useSession } from '../../modules/auth/SessionContext';
// Telas do caminho crítico: entram direto no arranque.
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';

/**
 * Telas fora do caminho crítico (RNF01). O require só acontece quando o
 * usuário navega para elas.
 */
const CadastroScreen = lazyScreen(() =>
  import('../screens/CadastroScreen').then((m) => ({ default: m.CadastroScreen })),
);
const MeusPalpitesScreen = lazyScreen(() =>
  import('../screens/MeusPalpitesScreen').then((m) => ({ default: m.MeusPalpitesScreen })),
);
const RankingScreen = lazyScreen(() =>
  import('../screens/RankingScreen').then((m) => ({ default: m.RankingScreen })),
);
const PerfilScreen = lazyScreen(() =>
  import('../screens/PerfilScreen').then((m) => ({ default: m.PerfilScreen })),
);
const DetalhePartidaScreen = lazyScreen(() =>
  import('../screens/DetalhePartidaScreen').then((m) => ({ default: m.DetalhePartidaScreen })),
);
const CompararTimesScreen = lazyScreen(() =>
  import('../screens/CompararTimesScreen').then((m) => ({ default: m.CompararTimesScreen })),
);
const PartidaAoVivoScreen = lazyScreen(() =>
  import('../screens/PartidaAoVivoScreen').then((m) => ({ default: m.PartidaAoVivoScreen })),
);
const OfflineScreen = lazyScreen(() =>
  import('../screens/OfflineScreen').then((m) => ({ default: m.OfflineScreen })),
);
const PainelAdminScreen = lazyScreen(() =>
  import('../screens/PainelAdminScreen').then((m) => ({ default: m.PainelAdminScreen })),
);
const FiltrosScreen = lazyScreen(() =>
  import('../screens/FiltrosScreen').then((m) => ({ default: m.FiltrosScreen })),
);
const RegistrarPalpiteScreen = lazyScreen(() =>
  import('../screens/RegistrarPalpiteScreen').then((m) => ({ default: m.RegistrarPalpiteScreen })),
);
const BuscaScreen = lazyScreen(() =>
  import('../screens/BuscaScreen').then((m) => ({ default: m.BuscaScreen })),
);
const MapaEstadiosScreen = lazyScreen(() =>
  import('../screens/MapaEstadiosScreen').then((m) => ({ default: m.MapaEstadiosScreen })),
);
const ResumoDiarioScreen = lazyScreen(() =>
  import('../screens/ResumoDiarioScreen').then((m) => ({ default: m.ResumoDiarioScreen })),
);
const BoletimRodadaScreen = lazyScreen(() =>
  import('../screens/BoletimRodadaScreen').then((m) => ({ default: m.BoletimRodadaScreen })),
);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.acc,
    background: colors.bg,
    card: colors.sur,
    text: colors.ink,
    border: colors.bd,
  },
};

function TabsNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MeusPalpites" component={MeusPalpitesScreen} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, restoring } = useSession();

  // Enquanto a sessão guardada é validada, não decidimos entre login e abas:
  // mostrar o login para quem já está logado seria um piscar indevido.
  if (restoring) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.sur,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.acc} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.sur } }}
      >
        {user ? (
          <Stack.Group>
            <Stack.Screen name="Tabs" component={TabsNavigator} />
            <Stack.Screen name="DetalhePartida" component={DetalhePartidaScreen} />
            <Stack.Screen name="CompararTimes" component={CompararTimesScreen} />
            <Stack.Screen name="PartidaAoVivo" component={PartidaAoVivoScreen} />
            <Stack.Screen name="Offline" component={OfflineScreen} />
            <Stack.Screen name="PainelAdmin" component={PainelAdminScreen} />
            <Stack.Screen name="Busca" component={BuscaScreen} />
            <Stack.Screen name="MapaEstadios" component={MapaEstadiosScreen} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="Filtros" component={FiltrosScreen} />
              <Stack.Screen name="RegistrarPalpite" component={RegistrarPalpiteScreen} />
              <Stack.Screen name="ResumoDiario" component={ResumoDiarioScreen} />
              <Stack.Screen name="BoletimRodada" component={BoletimRodadaScreen} />
            </Stack.Group>
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
