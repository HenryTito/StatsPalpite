'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { sequelize, User, RankingSnapshot } = require('../../src/models');
const rankingService = require('../../src/services/rankingService');
const { run: runSeed } = require('../../src/database/seed');
const { resetDatabase } = require('../helpers/database');

const app = createApp();
const API = '/api/v1';

let session;

beforeAll(async () => {
  await resetDatabase();
  await runSeed();

  const response = await request(app)
    .post(`${API}/auth/login`)
    .send({ email: 'henry@statspalpite.app', password: 'Palpite123' });
  session = response.body;
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /ranking (RF10)', () => {
  it('ordena por pontos, do maior para o menor', async () => {
    const response = await request(app).get(`${API}/ranking`);

    expect(response.status).toBe(200);
    const points = response.body.entries.map((entry) => entry.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it('numera as posições a partir de 1', async () => {
    const response = await request(app).get(`${API}/ranking`);
    expect(response.body.entries[0].position).toBe(1);
  });

  it('mantém a numeração correta ao paginar', async () => {
    const page = await request(app).get(`${API}/ranking?limit=2&offset=2`);
    expect(page.body.entries[0].position).toBe(3);
  });
});

describe('GET /ranking/me (RF80)', () => {
  it('informa posição, pontos e quanto falta para subir', async () => {
    const response = await request(app)
      .get(`${API}/ranking/me`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.position).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('pointsToClimb');
    expect(response.body).toHaveProperty('leaderPoints');
  });

  it('exige autenticação', async () => {
    const response = await request(app).get(`${API}/ranking/me`);
    expect(response.status).toBe(401);
  });

  it('calcula a posição de forma coerente com a listagem', async () => {
    const mine = await request(app)
      .get(`${API}/ranking/me`)
      .set('Authorization', `Bearer ${session.accessToken}`);
    const list = await request(app).get(`${API}/ranking?limit=100`);

    const fromList = list.body.entries.find((entry) => entry.userId === mine.body.userId);
    expect(fromList.position).toBe(mine.body.position);
  });
});

describe('GET /ranking/me/history (RF71)', () => {
  it('devolve a série dos últimos 30 dias', async () => {
    const response = await request(app)
      .get(`${API}/ranking/me/history`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.points.length).toBeGreaterThan(0);
    expect(response.body.points[0]).toHaveProperty('date');
    expect(response.body.points[0]).toHaveProperty('position');
  });

  it('ordena os pontos por data crescente', async () => {
    const response = await request(app)
      .get(`${API}/ranking/me/history`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    const dates = response.body.points.map((point) => point.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('informa melhor e pior posição da janela', async () => {
    const response = await request(app)
      .get(`${API}/ranking/me/history`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(response.body.best).toBeLessThanOrEqual(response.body.worst);
  });

  it('o retrato diário é idempotente', async () => {
    const before = await RankingSnapshot.count();
    await rankingService.captureDailySnapshot();
    await rankingService.captureDailySnapshot();
    expect(await RankingSnapshot.count()).toBe(before);
  });
});

describe('GET /digest/daily (RF53)', () => {
  it('devolve os destaques do dia', async () => {
    const response = await request(app).get(`${API}/digest/daily`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totals');
    expect(Array.isArray(response.body.highlights)).toBe(true);
  });

  it('inclui a posição do usuário quando autenticado', async () => {
    const anonymous = await request(app).get(`${API}/digest/daily`);
    const authenticated = await request(app)
      .get(`${API}/digest/daily`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(anonymous.body.ranking).toBeNull();
    expect(authenticated.body.ranking).not.toBeNull();
    expect(authenticated.body.ranking).toHaveProperty('position');
  });

  it('traz a distribuição dos palpites da comunidade (RF24)', async () => {
    const response = await request(app).get(`${API}/digest/daily`);
    const withCommunity = response.body.highlights.filter((item) => item.community);

    withCommunity.forEach((item) => {
      const { home, draw, away, total } = item.community;
      expect(home + draw + away).toBe(total);
    });
  });
});

describe('GET /digest/previous-round (RF77)', () => {
  it('resume a rodada anterior com resultados reais', async () => {
    const response = await request(app).get(`${API}/digest/previous-round`);

    expect(response.status).toBe(200);
    expect(response.body.totals.matches).toBeGreaterThan(0);
    expect(Array.isArray(response.body.results)).toBe(true);
  });

  it('separa os melhores palpites dos maiores erros', async () => {
    const response = await request(app).get(`${API}/digest/previous-round`);

    expect(Array.isArray(response.body.topPredictions)).toBe(true);
    expect(Array.isArray(response.body.biggestMisses)).toBe(true);
    response.body.topPredictions.forEach((item) => {
      expect(item.pointsAwarded).toBeGreaterThan(0);
    });
  });
});

describe('controle de acesso por papel (RF14)', () => {
  it('permite sincronização ao administrador', async () => {
    const response = await request(app)
      .post(`${API}/admin/sync?days=2`)
      .set('Authorization', `Bearer ${session.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('matches');
  });

  it('recusa usuário comum', async () => {
    const common = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'ana@statspalpite.app', password: 'Palpite123' });

    const response = await request(app)
      .post(`${API}/admin/sync`)
      .set('Authorization', `Bearer ${common.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('recusa requisição sem token', async () => {
    const response = await request(app).post(`${API}/admin/sync`);
    expect(response.status).toBe(401);
  });
});

describe('log de auditoria (RF25)', () => {
  it('registra o login do usuário', async () => {
    const { AuditLog } = require('../../src/models');
    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'henry@statspalpite.app', password: 'Palpite123' });

    // O registro é gravado no evento 'finish' da resposta, logo depois dela.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(await AuditLog.count({ where: { action: 'auth.login' } })).toBeGreaterThan(0);
  });
});

describe('semente de dados', () => {
  it('cria os usuários de demonstração', async () => {
    expect(await User.count()).toBeGreaterThanOrEqual(8);
  });
});
