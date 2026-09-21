import type { NavigatorScreenParams } from '@react-navigation/native';

/** Abas persistentes da barra inferior. */
export type TabParamList = {
  Home: undefined;
  MeusPalpites: undefined;
  Ranking: undefined;
  Perfil: undefined;
};

/** Pilha raiz: autenticacao, abas e telas empilhadas/modais. */
export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
  Filtros: undefined;
  DetalhePartida: { partidaId?: string } | undefined;
  RegistrarPalpite: { partidaId?: string } | undefined;
  CompararTimes: { mandante?: string; visitante?: string } | undefined;
  PartidaAoVivo: { partidaId?: string } | undefined;
  Offline: undefined;
  PainelAdmin: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
