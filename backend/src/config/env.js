'use strict';

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

/** Segredo padrão de desenvolvimento. Nunca pode valer em produção. */
const DEV_JWT_SECRET = 'segredo-de-desenvolvimento';

/**
 * Lê o segredo do JWT.
 *
 * Em produção não há padrão: subir com um segredo conhecido equivale a deixar
 * qualquer pessoa assinar um token de administrador. O processo se recusa a
 * iniciar, o que é muito melhor do que iniciar inseguro e ninguém perceber.
 */
function readJwtSecret(environment) {
  const secret = process.env.JWT_SECRET;

  if (environment === 'production') {
    if (!secret || secret === DEV_JWT_SECRET) {
      throw new Error(
        'JWT_SECRET ausente ou igual ao padrão de desenvolvimento. ' +
          'Defina um segredo próprio antes de subir em produção.',
      );
    }
    if (secret.length < 32) {
      throw new Error('JWT_SECRET precisa de pelo menos 32 caracteres em produção.');
    }
  }

  return secret || DEV_JWT_SECRET;
}

/** Lê uma variável booleana. Só "true" liga; qualquer outra coisa desliga. */
function bool(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw.toLowerCase() === 'true';
}

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Variável de ambiente ${name} deve ser um número inteiro`);
  }
  return parsed;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';
const isProduction = nodeEnv === 'production';

module.exports = {
  nodeEnv,
  isTest,
  isProduction,
  port: int('PORT', 3333),
  appUrl: process.env.APP_URL || 'http://localhost:3333',

  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: int('DB_PORT', 5432),
    name: isTest
      ? process.env.DB_NAME_TEST || 'statspalpite_test'
      : process.env.DB_NAME || 'statspalpite',
    user: process.env.DB_USER || 'statspalpite',
    password: process.env.DB_PASS || 'statspalpite',
  },

  auth: {
    jwtSecret: readJwtSecret(nodeEnv),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenDays: int('REFRESH_TOKEN_EXPIRES_IN_DAYS', 30),
    passwordResetMinutes: int('PASSWORD_RESET_EXPIRES_IN_MINUTES', 15),
    /** Idade mínima exigida pelo RF31. */
    minimumAge: 18,
    /**
     * Devolve o token de redefinição no corpo da resposta, para teste manual
     * sem caixa de e-mail. Precisa ser ligado de propósito e é recusado em
     * produção: amarrar isso a NODE_ENV deixaria qualquer deploy esquecido
     * entregando a redefinição de senha de qualquer conta.
     */
    exposeResetToken: !isProduction && bool('EXPOSE_RESET_TOKEN', isTest),
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: int('SMTP_PORT', 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'StatsPalpite <nao-responda@statspalpite.app>',
  },

  providers: {
    /** Qual adapter responde primeiro; o secundário atende o fallback do RNF11. */
    primary: process.env.FOOTBALL_PRIMARY || 'local',
    secondary: process.env.FOOTBALL_SECONDARY || 'local',
    apiFootballKey: process.env.API_FOOTBALL_KEY || '',
    footballDataKey: process.env.FOOTBALL_DATA_KEY || '',
    openWeatherKey: process.env.OPENWEATHERMAP_KEY || '',
  },

  cache: {
    matches: int('CACHE_TTL_MATCHES', 300),
    statistics: int('CACHE_TTL_STATISTICS', 900),
    weather: int('CACHE_TTL_WEATHER', 1800),
    injuries: int('CACHE_TTL_INJURIES', 3600),
    referee: int('CACHE_TTL_REFEREE', 86400),
  },

  sentryDsn: process.env.SENTRY_DSN || '',

  http: {
    /**
     * Quantos proxies há na frente da API. Com 0, o Express ignora
     * X-Forwarded-For e usa o IP real da conexão.
     *
     * Confiar no cabeçalho sem proxy de verdade na frente permite a qualquer
     * cliente forjar o próprio IP e, com isso, escapar do limite de tentativas
     * de login — força bruta sem teto.
     */
    trustProxyHops: int('TRUST_PROXY_HOPS', 0),
    /** Origens permitidas pelo CORS. Vazio libera todas (uso em desenvolvimento). */
    corsOrigins: (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
};
