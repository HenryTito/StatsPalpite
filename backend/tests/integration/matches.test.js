'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { sequelize, Match, Team, Venue } = require('../../src/models');
const ingestionService = require('../../src/services/ingestionService');
const { resetDatabase } = require('../helpers/database');

const app = createApp();
const API = '/api/v1';

beforeAll(async () => {
  await resetDatabase();
  // Popula pelo mesmo caminho da produção: motor de ingestão -> banco.
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + 7);
  await ingestionService.syncAll({ from, to });
});

afterAll(async () => {
  await sequelize.close();
});

describe('ingestão (B008)', () => {
  it('persiste o catálogo completo', async () => {
    expect(await Team.count()).toBeGreaterThan(0);
    expect(await Match.count()).toBeGreaterThan(0);
    expect(await Venue.count()).toBeGreaterThan(0);
  });

  it('é idempotente: sincronizar de novo não duplica', async () => {
    const before = await Match.count();
    await ingestionService.syncAll();
    expect(await Match.count()).toBe(before);
  });

  it('resolve as chaves estrangeiras, sem partida órfã', async () => {
    const orphans = await Match.count({ where: { leagueId: null } });
    expect(orphans).toBe(0);
  });
});

describe('GET /matches (RF03)', () => {
  it('lista as partidas do dia', async () => {
    const response = await request(app).get(`${API}/matches`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.matches)).toBe(true);
    expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('traz probabilidade que soma 100 em toda partida', async () => {
    const response = await request(app).get(`${API}/matches`);

    response.body.matches.forEach((match) => {
      const { home, draw, away } = match.probability;
      expect(home + draw + away).toBe(100);
    });
  });

  it('filtra por data', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const response = await request(app).get(`${API}/matches?date=${date}`);

    expect(response.status).toBe(200);
    expect(response.body.date).toBe(date);
    response.body.matches.forEach((match) => {
      expect(match.kickoffAt.slice(0, 10)).toBe(date);
    });
  });

  it('filtra por status', async () => {
    const past = new Date();
    past.setUTCDate(past.getUTCDate() - 5);
    const date = past.toISOString().slice(0, 10);

    const response = await request(app).get(`${API}/matches?date=${date}&status=finished`);

    expect(response.status).toBe(200);
    response.body.matches.forEach((match) => expect(match.status).toBe('finished'));
  });

  it('recusa data em formato inválido', async () => {
    const response = await request(app).get(`${API}/matches?date=01-10-2026`);
    expect(response.status).toBe(422);
  });

  it('recusa limite acima do teto', async () => {
    const response = await request(app).get(`${API}/matches?limit=5000`);
    expect(response.status).toBe(422);
  });
});

describe('GET /matches/:id (RF04)', () => {
  let finishedMatch;

  beforeAll(async () => {
    finishedMatch = await Match.findOne({ where: { status: 'finished' } });
  });

  it('devolve as estatísticas avançadas', async () => {
    const response = await request(app).get(`${API}/matches/${finishedMatch.id}`);

    expect(response.status).toBe(200);
    expect(response.body.statistics).not.toBeNull();
    expect(response.body.statistics).toHaveProperty('homePossession');
    expect(response.body.statistics).toHaveProperty('homeCorners');
    expect(response.body.statistics).toHaveProperty('homePassAccuracy');
  });

  it('inclui clima, árbitro e desfalques (RF15, RF62, RF36)', async () => {
    const response = await request(app).get(`${API}/matches/${finishedMatch.id}`);

    expect(response.body).toHaveProperty('weather');
    expect(response.body).toHaveProperty('referee');
    expect(Array.isArray(response.body.injuries)).toBe(true);
  });

  it('traz as médias do árbitro quando ele está designado (RF62)', async () => {
    const response = await request(app).get(`${API}/matches/${finishedMatch.id}`);

    if (response.body.referee) {
      expect(response.body.referee.averages).toHaveProperty('fouls');
      expect(response.body.referee.averages).toHaveProperty('yellowCards');
    }
  });

  it('responde 404 para partida inexistente', async () => {
    const response = await request(app).get(
      `${API}/matches/00000000-0000-4000-8000-000000000000`,
    );
    expect(response.status).toBe(404);
  });

  it('responde 422 para id que não é uuid', async () => {
    const response = await request(app).get(`${API}/matches/abc`);
    expect(response.status).toBe(422);
  });
});

describe('GET /compare (RF06, RF37)', () => {
  let home;
  let away;

  beforeAll(async () => {
    const match = await Match.findOne({ where: { status: 'finished' } });
    home = match.homeTeamId;
    away = match.awayTeamId;
  });

  it('devolve retrospecto, forma e histórico', async () => {
    const response = await request(app).get(
      `${API}/compare?homeTeamId=${home}&awayTeamId=${away}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.record).toHaveProperty('homeWins');
    expect(response.body.record).toHaveProperty('draws');
    expect(response.body.record).toHaveProperty('awayWins');
    expect(Array.isArray(response.body.history)).toBe(true);
  });

  it('conta o retrospecto nos dois sentidos de mando', async () => {
    const response = await request(app).get(
      `${API}/compare?homeTeamId=${home}&awayTeamId=${away}`,
    );
    const { homeWins, draws, awayWins, played } = response.body.record;

    expect(homeWins + draws + awayWins).toBe(played);
    expect(played).toBeGreaterThan(0);
  });

  it('é simétrico: inverter os times inverte o retrospecto', async () => {
    const direct = await request(app).get(`${API}/compare?homeTeamId=${home}&awayTeamId=${away}`);
    const inverse = await request(app).get(`${API}/compare?homeTeamId=${away}&awayTeamId=${home}`);

    expect(inverse.body.record.homeWins).toBe(direct.body.record.awayWins);
    expect(inverse.body.record.awayWins).toBe(direct.body.record.homeWins);
    expect(inverse.body.record.draws).toBe(direct.body.record.draws);
  });

  it('responde 404 quando um dos times não existe', async () => {
    const response = await request(app).get(
      `${API}/compare?homeTeamId=${home}&awayTeamId=00000000-0000-4000-8000-000000000000`,
    );
    expect(response.status).toBe(404);
  });
});

describe('GET /venues (RF49)', () => {
  it('devolve estádios com coordenadas para o mapa', async () => {
    const response = await request(app).get(`${API}/venues`);

    expect(response.status).toBe(200);
    const withCoordinates = response.body.venues.filter((venue) => venue.coordinates);
    expect(withCoordinates.length).toBeGreaterThan(0);
    expect(withCoordinates[0].coordinates).toHaveProperty('latitude');
    expect(withCoordinates[0].coordinates).toHaveProperty('longitude');
  });
});

describe('GET /health', () => {
  it('relata banco e fontes', async () => {
    const response = await request(app).get(`${API}/health`);

    expect(response.status).toBe(200);
    expect(response.body.database.healthy).toBe(true);
    expect(response.body.providers.primary).toHaveProperty('name');
    expect(response.body.providers.cache).toHaveProperty('fallbacks');
  });
});
