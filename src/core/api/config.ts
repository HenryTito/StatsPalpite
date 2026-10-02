import { Platform } from 'react-native';

/**
 * Endereco da API.
 *
 * O emulador Android nao enxerga `localhost` do host: 10.0.2.2 e o alias que
 * o AVD usa para a maquina onde ele roda. Em device fisico, aponte
 * EXPO_PUBLIC_API_URL para o IP da maquina na rede local.
 */
const DEFAULT_PORT = 3333;

function defaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`;
}

export const apiConfig = {
  baseUrl: `${defaultBaseUrl()}/api/v1`,
  /** Acima disto a requisicao e abortada, para a tela nao ficar presa. */
  timeoutMs: 10000,
} as const;
