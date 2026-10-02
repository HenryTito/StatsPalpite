import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './navigation/RootNavigator';
import { I18nProvider } from '../core/i18n';
import { initSentry } from '../core/observability/sentry';
import { colors } from '../core/theme';
import { ErrorBoundary } from '../core/ui';
import { SessionProvider } from '../modules/auth/SessionContext';

// Antes de qualquer render, para capturar erro de inicialização (RNF08).
initSentry();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <I18nProvider>
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          </I18nProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
