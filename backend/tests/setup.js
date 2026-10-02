'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-de-teste';

// Sem SMTP, o mailService entra em modo console e o fluxo do RF02 fica testável.
process.env.SMTP_HOST = '';

/**
 * A suíte usa SEMPRE a fonte local, nunca a API externa.
 *
 * Teste que depende de rede fica lento, falha por motivo alheio ao que
 * verifica e esbarra no limite de requisições do plano gratuito. A fonte
 * local é determinística, e os adapters reais são cobertos por testes de
 * tradução que não fazem chamada nenhuma.
 *
 * dotenv não sobrescreve variável já definida, então o que está aqui vence
 * o que estiver no .env.
 */
process.env.FOOTBALL_PRIMARY = 'local';
process.env.FOOTBALL_SECONDARY = 'local';
process.env.API_FOOTBALL_KEY = '';
process.env.FOOTBALL_DATA_KEY = '';
process.env.OPENWEATHERMAP_KEY = '';

// O token de redefinição volta na resposta para os testes do RF02 conferirem.
process.env.EXPOSE_RESET_TOKEN = 'true';
