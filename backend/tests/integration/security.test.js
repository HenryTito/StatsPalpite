'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { sequelize, User, Team, Match } = require('../../src/models');
const ingestionService = require('../../src/services/ingestionService');
const { resetDatabase } = require('../helpers/database');

const app = createApp();
const API = '/api/v1';

/**
 * Suíte adversarial: cada teste é uma tentativa de quebrar o sistema.
 *
 * Existe porque um sistema que só é exercitado pelo caminho feliz parece
 * correto até alguém digitar uma data impossível, forjar um cabeçalho ou
 * mandar um JSON pela metade.
 */

let session;
let team;

beforeAll(async () => {
  await resetDatabase();
  await ingestionService.syncAll();

  const registration = await request(app).post(`${API}/auth/register`).send({
    email: 'seguranca@statspalpite.app',
    username: 'segteste',
    password: 'Palpite123',
    passwordConfirmation: 'Palpite123',
    birthDate: '1998-04-12',
  });
  session = registration.body;
  team = await Team.findOne();
});

afterAll(async () => {
  await sequelize.close();
});

describe('injeção', () => {
  it('não executa SQL vindo do termo de busca', async () => {
    const payloads = [
      "'; DROP TABLE users; --",
      "' UNION SELECT null, version(), null--",
      "' OR '1'='1",
      "%'; DELETE FROM teams WHERE '1'='1",
    ];

    for (const payload of payloads) {
      const response = await request(app).get(`${API}/search`).query({ q: payload });
      expect([200, 422]).toContain(response.status);
    }

    // As tabelas continuam de pé e populadas.
    expect(await User.count()).toBeGreaterThan(0);
    expect(await Team.count()).toBeGreaterThan(0);
  });

  it('recusa um tipo de busca fora da lista fechada', async () => {
    const response = await request(app)
      .get(`${API}/search`)
      .query({ q: 'palmeiras', types: 'users' });
    expect(response.status).toBe(422);
  });
});

describe('escalação de privilégio', () => {
  it('ignora role e pontos enviados no cadastro', async () => {
    const response = await request(app).post(`${API}/auth/register`).send({
      email: 'escalada@statspalpite.app',
      username: 'escalada',
      password: 'Palpite123',
      passwordConfirmation: 'Palpite123',
      birthDate: '1990-01-01',
      role: 'admin',
      points: 999999,
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('user');
    expect(response.body.user.points).toBe(0);
  });

  it('barra rota de administração para usuário comum', async () => {
    const response = await request(app)
      .post(`${API}/admin/sync`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN_ROLE');
  });
});

describe('tokens forjados', () => {
  it('recusa JWT com alg=none', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'qualquer', role: 'admin' })).toString(
      'base64url',
    );

    const response = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${header}.${payload}.`);

    expect(response.status).toBe(401);
  });

  it('recusa JWT assinado com outro segredo', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ sub: 'qualquer', role: 'admin' }, 'outro-segredo');

    const response = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${forged}`);
    expect(response.status).toBe(401);
  });

  it('recusa refresh token inventado', async () => {
    const response = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: 'a'.repeat(96) });

    expect(response.status).toBe(401);
  });
});

describe('entradas que costumam derrubar servidor', () => {
  it('recusa data com formato válido mas inexistente no calendário', async () => {
    for (const date of ['2026-13-45', '2026-02-31', '0000-00-00', '2026-11-31']) {
      const response = await request(app).get(`${API}/matches`).query({ date });
      expect(response.status).toBe(422);
    }
  });

  it('recusa data inexistente também no resumo diário e no cadastro', async () => {
    expect(
      (await request(app).get(`${API}/digest/daily`).query({ date: '2026-02-30' })).status,
    ).toBe(422);

    const registration = await request(app).post(`${API}/auth/register`).send({
      email: 'datafalsa@statspalpite.app',
      username: 'datafalsa',
      password: 'Palpite123',
      passwordConfirmation: 'Palpite123',
      birthDate: '2001-02-30',
    });
    expect(registration.status).toBe(422);
  });

  it('aceita 29 de fevereiro em ano bissexto', async () => {
    const response = await request(app).get(`${API}/matches`).query({ date: '2024-02-29' });
    expect(response.status).toBe(200);
  });

  it('recusa offset grande demais em vez de estourar o banco', async () => {
    const response = await request(app)
      .get(`${API}/ranking`)
      .query({ offset: '99999999999999999999' });
    expect(response.status).toBe(422);
  });

  it('recusa termo de busca absurdamente longo', async () => {
    const response = await request(app)
      .get(`${API}/search`)
      .query({ q: 'a'.repeat(5000) });
    expect(response.status).toBe(422);
  });

  it('responde 400 a JSON malformado, não 500', async () => {
    const response = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('recusa corpo grande demais', async () => {
    const response = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.com', password: 'x'.repeat(400 * 1024) }));

    expect(response.status).toBe(413);
  });

  it('recusa janela de sincronização absurda', async () => {
    const admin = await User.findOne({ where: { email: 'seguranca@statspalpite.app' } });
    await admin.update({ role: 'admin' });

    const fresh = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'seguranca@statspalpite.app', password: 'Palpite123' });

    const response = await request(app)
      .post(`${API}/admin/sync`)
      .query({ days: 99999999 })
      .set('Authorization', `Bearer ${fresh.body.accessToken}`);

    expect(response.status).toBe(422);

    await admin.update({ role: 'user' });
  });

  it('recusa comparar um time consigo mesmo', async () => {
    const response = await request(app)
      .get(`${API}/compare`)
      .query({ homeTeamId: team.id, awayTeamId: team.id });

    expect(response.status).toBe(422);
  });

  it('responde 404, não 500, para uuid válido e inexistente', async () => {
    const response = await request(app).get(`${API}/matches/00000000-0000-4000-8000-000000000000`);
    expect(response.status).toBe(404);
  });

  it('responde 404 em rota inexistente', async () => {
    const response = await request(app).get(`${API}/rota-que-nao-existe`);
    expect(response.status).toBe(404);
  });
});

describe('vazamento de dados', () => {
  it('nunca devolve o hash da senha', async () => {
    const endpoints = [
      request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${session.accessToken}`),
      request(app).get(`${API}/ranking`),
    ];

    for (const call of endpoints) {
      const response = await call;
      const body = JSON.stringify(response.body);
      expect(body).not.toContain('passwordHash');
      expect(body).not.toContain('$2a$');
      expect(body).not.toContain('$2b$');
    }
  });

  it('não devolve o token de redefinição quando a exposição está desligada', async () => {
    const env = require('../../src/config/env');
    const original = env.auth.exposeResetToken;
    env.auth.exposeResetToken = false;

    try {
      const response = await request(app)
        .post(`${API}/auth/forgot-password`)
        .send({ email: 'seguranca@statspalpite.app' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeUndefined();
    } finally {
      env.auth.exposeResetToken = original;
    }
  });

  it('o ranking expõe apenas apelido e pontos', async () => {
    const response = await request(app).get(`${API}/ranking`);
    const [entry] = response.body.entries;

    expect(Object.keys(entry).sort()).toEqual(['points', 'position', 'userId', 'username']);
    expect(JSON.stringify(response.body)).not.toContain('@');
  });

  it('não revela se um e-mail está cadastrado', async () => {
    const existing = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'seguranca@statspalpite.app' });
    const unknown = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'ninguem@statspalpite.app' });

    expect(unknown.status).toBe(existing.status);
    expect(unknown.body.message).toBe(existing.body.message);
  });
});

describe('enumeração de contas por tempo de resposta', () => {
  /**
   * Comparar a senha contra uma string inventada devolveria em 0ms, enquanto
   * uma conta real custa dezenas de milissegundos. A diferença é medível e
   * revela quais e-mails estão cadastrados.
   */
  const medir = async (email) => {
    const inicio = process.hrtime.bigint();
    await request(app).post(`${API}/auth/login`).send({ email, password: 'SenhaErrada1' });
    return Number(process.hrtime.bigint() - inicio) / 1e6;
  };

  it('leva tempo comparável para e-mail existente e inexistente', async () => {
    const amostras = 5;
    let existente = 0;
    let inexistente = 0;

    for (let i = 0; i < amostras; i += 1) {
      existente += await medir('seguranca@statspalpite.app');
      inexistente += await medir(`ninguem${i}@statspalpite.app`);
    }

    const mediaExistente = existente / amostras;
    const mediaInexistente = inexistente / amostras;
    const maior = Math.max(mediaExistente, mediaInexistente);
    const menor = Math.min(mediaExistente, mediaInexistente);

    // Uma razão acima de 3x denunciaria que um dos caminhos pula o bcrypt.
    expect(maior / menor).toBeLessThan(3);
  });
});

describe('isolamento entre usuários', () => {
  it('cada sessão só enxerga a própria posição no ranking', async () => {
    const other = await request(app).post(`${API}/auth/register`).send({
      email: 'outro@statspalpite.app',
      username: 'outrousuario',
      password: 'Palpite123',
      passwordConfirmation: 'Palpite123',
      birthDate: '1995-06-15',
    });

    const mine = await request(app)
      .get(`${API}/ranking/me`)
      .set('Authorization', `Bearer ${session.accessToken}`);
    const theirs = await request(app)
      .get(`${API}/ranking/me`)
      .set('Authorization', `Bearer ${other.body.accessToken}`);

    expect(mine.body.userId).toBe(session.user.id);
    expect(theirs.body.userId).toBe(other.body.user.id);
    expect(mine.body.userId).not.toBe(theirs.body.userId);
  });

  it('usuário excluído não consegue mais usar o token que tinha', async () => {
    const victim = await request(app).post(`${API}/auth/register`).send({
      email: 'excluido@statspalpite.app',
      username: 'excluido',
      password: 'Palpite123',
      passwordConfirmation: 'Palpite123',
      birthDate: '1992-03-03',
    });

    await User.destroy({ where: { id: victim.body.user.id } });

    const response = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${victim.body.accessToken}`);

    expect(response.status).toBe(401);
  });
});

describe('integridade dos dados', () => {
  it('probabilidade sempre soma 100, em toda partida do catálogo', async () => {
    const matches = await Match.findAll({ limit: 40 });

    for (const match of matches) {
      const response = await request(app).get(`${API}/matches/${match.id}`);
      expect(response.status).toBe(200);
      const { home, draw, away } = response.body.probability;
      expect(home + draw + away).toBe(100);
      expect(home).toBeGreaterThanOrEqual(0);
      expect(draw).toBeGreaterThanOrEqual(0);
      expect(away).toBeGreaterThanOrEqual(0);
    }
  });

  it('nenhuma partida fica sem liga ou sem times', async () => {
    expect(await Match.count({ where: { leagueId: null } })).toBe(0);
    expect(await Match.count({ where: { homeTeamId: null } })).toBe(0);
    expect(await Match.count({ where: { awayTeamId: null } })).toBe(0);
  });
});
