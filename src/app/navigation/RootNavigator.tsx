import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';
import { colors } from '../../core/theme';
import { CadastroScreen } from '../screens/CadastroScreen';
import { CompararTimesScreen } from '../screens/CompararTimesScreen';
import { DetalhePartidaScreen } from '../screens/DetalhePartidaScreen';
import { FiltrosScreen } from '../screens/FiltrosScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MeusPalpitesScreen } from '../screens/MeusPalpitesScreen';
import { OfflineScreen } from '../screens/OfflineScreen';
import { PainelAdminScreen } from '../screens/PainelAdminScreen';
import { PartidaAoVivoScreen } from '../screens/PartidaAoVivoScreen';
import { PerfilScreen } from '../screens/PerfilScreen';
import { RankingScreen } from '../screens/RankingScreen';
import { RegistrarPalpiteScreen } from '../screens/RegistrarPalpiteScreen';

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
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.sur } }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen name="DetalhePartida" component={DetalhePartidaScreen} />
        <Stack.Screen name="CompararTimes" component={CompararTimesScreen} />
        <Stack.Screen name="PartidaAoVivo" component={PartidaAoVivoScreen} />
        <Stack.Screen name="Offline" component={OfflineScreen} />
        <Stack.Screen name="PainelAdmin" component={PainelAdminScreen} />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="Filtros" component={FiltrosScreen} />
          <Stack.Screen name="RegistrarPalpite" component={RegistrarPalpiteScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
