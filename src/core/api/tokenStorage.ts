import * as SecureStore from 'expo-secure-store';

/**
 * Guarda os tokens no armazenamento seguro do sistema (RF76).
 *
 * expo-secure-store usa o Keystore no Android. AsyncStorage nao serve aqui:
 * ele grava em texto puro num arquivo que qualquer backup le.
 */
const ACCESS_KEY = 'statspalpite.accessToken';
const REFRESH_KEY = 'statspalpite.refreshToken';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
};

/** Leitura tolerante: chave ausente ou store indisponivel devolve null. */
async function readKey(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export const tokenStorage = {
  async save(session: StoredSession): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, session.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken),
    ]);
  },

  async load(): Promise<StoredSession | null> {
    const [accessToken, refreshToken] = await Promise.all([
      readKey(ACCESS_KEY),
      readKey(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined),
    ]);
  },
};
