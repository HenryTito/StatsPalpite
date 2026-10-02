'use strict';

const express = require('express');
const request = require('supertest');

const { createAuthLimiter } = require('../../src/middlewares/rateLimiters');

/**
 * O limitador fica desligado no resto da suíte, para que dezenas de chamadas
 * de autenticação não virem 429 e escondam as falhas de negócio. Aqui ele é
 * ligado explicitamente, num app mínimo, para provar que o teto existe.
 */
function buildApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(createAuthLimiter({ enabled: true }));
  app.post('/entrar', (req, res) => res.json({ ok: true }));
  return app;
}

describe('limite de requisições nas rotas de credencial', () => {
  it('libera até 20 tentativas e barra a 21ª', async () => {
    const app = buildApp();

    for (let attempt = 1; attempt <= 20; attempt += 1) {
      const response = await request(app).post('/entrar');
      expect(response.status).toBe(200);
    }

    const blocked = await request(app).post('/entrar');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });

  it('anuncia o teto nos cabeçalhos padrão', async () => {
    const app = buildApp();
    const response = await request(app).post('/entrar');

    expect(response.headers['ratelimit-limit']).toBe('20');
    expect(response.headers['ratelimit-remaining']).toBe('19');
  });

  it('conta por cliente, não globalmente', async () => {
    const app = buildApp();

    // Esgota o teto de um IP...
    for (let attempt = 1; attempt <= 21; attempt += 1) {
      await request(app).post('/entrar').set('X-Forwarded-For', '203.0.113.1');
    }

    // ...e confirma que outro continua passando.
    const other = await request(app).post('/entrar').set('X-Forwarded-For', '203.0.113.2');
    expect(other.status).toBe(200);
  });
});
