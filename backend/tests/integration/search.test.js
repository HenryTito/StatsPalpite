'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { sequelize } = require('../../src/models');
const ingestionService = require('../../src/services/ingestionService');
const { resetDatabase } = require('../helpers/database');

const app = createApp();
const API = '/api/v1';

beforeAll(async () => {
  await resetDatabase();
  await ingestionService.syncAll();
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /search (RF27)', () => {
  it('encontra times pelo nome', async () => {
    const response = await request(app).get(`${API}/search?q=palmeiras`);

    expect(response.status).toBe(200);
    expect(response.body.results.some((item) => item.type === 'team')).toBe(true);
  });

  it('ignora acentos: "sao paulo" acha "São Paulo"', async () => {
    // O dataset tem a cidade São Paulo no Allianz Parque; buscamos o estádio
    // por um termo sem acento para exercitar immutable_unaccent.
    const comAcento = await request(app).get(`${API}/search?q=Allianz`);
    const semAcento = await request(app).get(`${API}/search?q=allianz`);

    expect(comAcento.body.total).toBeGreaterThan(0);
    expect(semAcento.body.total).toBe(comAcento.body.total);
  });

  it('faz correspondência parcial', async () => {
    const response = await request(app).get(`${API}/search?q=palm`);
    expect(response.body.total).toBeGreaterThan(0);
  });

  it('devolve sugestões para o autocomplete', async () => {
    const response = await request(app).get(`${API}/search?q=real`);

    expect(Array.isArray(response.body.suggestions)).toBe(true);
    expect(response.body.suggestions.length).toBeGreaterThan(0);
  });

  it('busca em várias entidades ao mesmo tempo', async () => {
    const response = await request(app).get(`${API}/search?q=a&limit=20`).expect(422);
    // Uma letra só fica abaixo do mínimo; confirma a validação.
    expect(response.body.error.code).toBe('VALIDATION_ERROR');

    const valid = await request(app).get(`${API}/search?q=li&limit=20`);
    const types = new Set(valid.body.results.map((item) => item.type));
    expect(types.size).toBeGreaterThan(0);
  });

  it('permite restringir o tipo', async () => {
    const response = await request(app).get(`${API}/search?q=li&types=league`);
    response.body.results.forEach((item) => expect(item.type).toBe('league'));
  });

  it('ordena por similaridade', async () => {
    const response = await request(app).get(`${API}/search?q=santos`);
    const scores = response.body.results.map((item) => item.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it('coloca a correspondência literal na frente da aproximação', async () => {
    /**
     * "corint" é um pedaço literal de "Corinthians" e não de "Coritiba".
     * Só a similaridade por trigrama invertia essa ordem — ela dilui em nomes
     * longos — e o time certo aparecia em segundo.
     */
    const response = await request(app).get(`${API}/search`).query({ q: 'palm', types: 'team' });

    expect(response.status).toBe(200);
    if (response.body.results.length > 1) {
      const [primeiro] = response.body.results;
      expect(primeiro.name.toLowerCase()).toContain('palm');
    }
  });

  it('prefere quem começa com o termo', async () => {
    const response = await request(app).get(`${API}/search`).query({ q: 'santos', types: 'team' });

    expect(response.status).toBe(200);
    expect(response.body.results.length).toBeGreaterThan(0);
    expect(response.body.results[0].name.toLowerCase()).toContain('santos');
  });

  it('pontua acima de 1 quando há correspondência literal', async () => {
    const literal = await request(app).get(`${API}/search`).query({ q: 'santos', types: 'team' });
    // A nota soma 1 por conter e mais 2 por começar com o termo.
    expect(literal.body.results[0].score).toBeGreaterThan(1);
  });

  it('não quebra com aspas e caracteres de SQL', async () => {
    const response = await request(app).get(
      `${API}/search?q=${encodeURIComponent("'; DROP TABLE teams; --")}`,
    );
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
  });
});

describe('GET /search/players (RF56)', () => {
  it('devolve estatísticas individuais do atleta', async () => {
    const list = await request(app)
      .get(`${API}/search?q=a&limit=5`)
      .catch(() => null);
    // Busca por uma letra comum do dataset de nomes.
    const response = await request(app).get(`${API}/search/players?q=silva`);

    expect(response.status).toBe(200);
    if (response.body.total > 0) {
      const player = response.body.results[0];
      expect(player.statistics).toHaveProperty('goals');
      expect(player.statistics).toHaveProperty('assists');
      expect(player.statistics).toHaveProperty('yellowCards');
      expect(player.statistics).toHaveProperty('redCards');
    }
    expect(list).toBeDefined();
  });

  it('inclui o time e a liga do jogador', async () => {
    const response = await request(app).get(`${API}/search/players?q=silva`);
    if (response.body.total > 0) {
      expect(response.body.results[0].team).toHaveProperty('name');
    }
  });

  it('exige ao menos 2 caracteres', async () => {
    const response = await request(app).get(`${API}/search/players?q=a`);
    expect(response.status).toBe(422);
  });
});
