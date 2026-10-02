import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Endereço da API.
 *
 * A ordem de resolução importa para o app funcionar em emulador e em
 * aparelho físico sem configuração manual:
 *
 *  1. EXPO_PUBLIC_API_URL, quando definida — manda em qualquer ambiente.
 *  2. O host que serviu o bundle. Em desenvolvimento, a API roda na mesma
 *     máquina que o Metro, então basta trocar a porta. É isso que faz um
 *     celular na mesma rede funcionar sem ninguém editar nada.
 *  3. 10.0.2.2, o apelido que o emulador do Android usa para a máquina onde
 *     ele roda. Serve quando o host do bundle não está disponível.
 */
const DEFAULT_PORT = 3333;

/** Host de onde o bundle veio, sem a porta. */
function metroHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Em versões mais antigas do Expo Go a informação vem por outro caminho.
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  // "localhost" aqui seria o próprio aparelho, não a máquina de desenvolvimento.
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  return host;
}

function defaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const host = metroHost();
  if (host) return `http://${host}:${DEFAULT_PORT}`;

  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`;
}

export const apiConfig = {
  baseUrl: `${defaultBaseUrl()}/api/v1`,
  /** Acima disto a requisição é abortada, para a tela não ficar presa. */
  timeoutMs: 10000,
} as const;
