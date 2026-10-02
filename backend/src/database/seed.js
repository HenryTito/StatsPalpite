'use strict';

const bcrypt = require('bcryptjs');

const logger = require('../config/logger');
const { sequelize, User, Match, Prediction } = require('../models');
const ingestionService = require('../services/ingestionService');
const rankingService = require('../services/rankingService');

/**
 * Popula o banco para desenvolvimento e demonstração.
 *
 * O catálogo (ligas, times, partidas, estatísticas) vem do motor de ingestão,
 * exatamente pelo mesmo caminho que usará a API externa. Aqui só acrescentamos
 * o que não existe na fonte: usuários, palpites e o histórico de ranking.
 */

const DEMO_PASSWORD = 'Palpite123';

const DEMO_USERS = [
  { username: 'henrytito', email: 'henry@statspalpite.app', role: 'admin', points: 328 },
  { username: 'marcosbet', email: 'marcos@statspalpite.app', role: 'user', points: 1204 },
  { username: 'ana_stats', email: 'ana@statspalpite.app', role: 'user', points: 1150 },
  { username: 'jp_futebol', email: 'jp@statspalpite.app', role: 'user', points: 1098 },
  { username: 'tatica10', email: 'tatica@statspalpite.app', role: 'user', points: 1041 },
  { username: 'gol_de_placa', email: 'gol@statspalpite.app', role: 'user', points: 987 },
  { username: 'bia_palpites', email: 'bia@statspalpite.app', role: 'user', points: 940 },
  { username: 'zagueiro77', email: 'zagueiro@statspalpite.app', role: 'user', points: 902 },
];

const CHOICES = ['home', 'draw', 'away'];

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];

  for (const demo of DEMO_USERS) {
    const [user] = await User.findOrCreate({
      where: { email: demo.email },
      defaults: {
        email: demo.email,
        username: demo.username,
        passwordHash,
        // Todos maiores de 18, para não esbarrarem no RF31.
        birthDate: '1998-04-12',
        role: demo.role,
        points: demo.points,
      },
    });
    users.push(user);
  }

  return users;
}

/**
 * Gera palpites para que os agregados do RF53, do RF77 e do RF26 tenham o que
 * somar. Determinístico pela posição do usuário e da partida, então o seed
 * produz sempre o mesmo cenário.
 */
async function seedPredictions(users) {
  const matches = await Match.findAll({ order: [['kickoffAt', 'DESC']], limit: 40 });
  if (!matches.length) return 0;

  let created = 0;

  for (const [userIndex, user] of users.entries()) {
    for (const [matchIndex, match] of matches.entries()) {
      // Nem todo usuário palpita em tudo: espalha para variar os volumes.
      if ((userIndex + matchIndex) % 3 !== 0) continue;

      const choice = CHOICES[(userIndex + matchIndex) % CHOICES.length];
      const stake = ((userIndex + matchIndex) % 10) + 1;
      const actual = match.outcome();

      let status = 'pending';
      let pointsAwarded = null;
      let settledAt = null;

      if (actual) {
        const hit = actual === choice;
        status = hit ? 'won' : 'lost';
        // Regra do RF10: acerto do vencedor paga 2x a aposta.
        pointsAwarded = hit ? stake * 2 : 0;
        settledAt = match.kickoffAt;
      }

      const [, wasCreated] = await Prediction.findOrCreate({
        where: { userId: user.id, matchId: match.id },
        defaults: {
          userId: user.id,
          matchId: match.id,
          choice,
          stake,
          status,
          pointsAwarded,
          settledAt,
          justification: matchIndex % 5 === 0 ? 'Mando de campo e forma recente favorecem.' : null,
        },
      });
      if (wasCreated) created += 1;
    }
  }

  return created;
}

/** Histórico de 30 dias para o gráfico do RF71. */
async function seedRankingHistory(users) {
  let days = 0;
  for (let offset = 30; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    await rankingService.captureDailySnapshot({ date });
    days += 1;
  }
  return { days, users: users.length };
}

async function run() {
  logger.info('seed: sincronizando catálogo pelo motor de ingestão');
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + 7);
  const ingestion = await ingestionService.syncAll({ from, to });

  logger.info('seed: criando usuários');
  const users = await seedUsers();

  logger.info('seed: criando palpites');
  const predictions = await seedPredictions(users);

  logger.info('seed: gravando histórico de ranking');
  const history = await seedRankingHistory(users);

  return { ingestion, users: users.length, predictions, history };
}

if (require.main === module) {
  run()
    .then(async (summary) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(summary, null, 2));
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error) => {
      // eslint-disable-next-line no-console
      console.error('seed falhou:', error);
      await sequelize.close();
      process.exit(1);
    });
}

module.exports = { run, DEMO_PASSWORD, DEMO_USERS };
