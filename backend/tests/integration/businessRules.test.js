'use strict';

const { Op } = require('sequelize');

const { sequelize, User, Match, Prediction, RankingSnapshot } = require('../../src/models');
const ingestionService = require('../../src/services/ingestionService');
const { resetDatabase } = require('../helpers/database');

/**
 * Regras de negócio garantidas pelo BANCO, não pela API.
 *
 * O endpoint de registrar palpite é da Sprint 2. Estas restrições existem
 * desde já porque a validação da aplicação é a primeira linha de defesa, não
 * a única: um script de manutenção, um seed ou um bug numa sprint futura
 * escrevem direto na tabela e passam por cima dela.
 *
 * Por isso cada teste escreve pelo caminho mais bruto possível — o model
 * Sequelize, sem passar por serviço nenhum — e espera ser barrado.
 */

let user;
let otherUser;
let futureMatch;
let finishedMatch;

/** Espera que a operação seja recusada pelo banco. */
async function expectRejected(operation) {
  await expect(operation()).rejects.toThrow();
}

beforeAll(async () => {
  await resetDatabase();
  await ingestionService.syncAll();

  user = await User.create({
    email: 'regras@statspalpite.app',
    username: 'regras',
    passwordHash: 'hash-irrelevante-para-este-teste',
    birthDate: '1995-01-01',
  });
  otherUser = await User.create({
    email: 'regras2@statspalpite.app',
    username: 'regras2',
    passwordHash: 'hash-irrelevante-para-este-teste',
    birthDate: '1995-01-01',
  });

  futureMatch = await Match.findOne({
    where: { status: 'scheduled', kickoffAt: { [Op.gt]: new Date() } },
  });
  finishedMatch = await Match.findOne({ where: { status: 'finished' } });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Prediction.destroy({ where: {} });
});

/** Palpite válido, com campos sobrescrevíveis por teste. */
function validPrediction(overrides = {}) {
  return {
    userId: user.id,
    matchId: futureMatch.id,
    choice: 'home',
    stake: 5,
    status: 'pending',
    ...overrides,
  };
}

describe('um palpite por usuário por partida', () => {
  it('aceita o primeiro palpite', async () => {
    const prediction = await Prediction.create(validPrediction());
    expect(prediction.id).toEqual(expect.any(String));
  });

  it('recusa um segundo palpite do mesmo usuário na mesma partida', async () => {
    await Prediction.create(validPrediction());
    await expectRejected(() => Prediction.create(validPrediction({ choice: 'away', stake: 3 })));
  });

  it('recusa mesmo quando a segunda escolha é idêntica', async () => {
    await Prediction.create(validPrediction());
    await expectRejected(() => Prediction.create(validPrediction()));
  });

  it('permite que OUTRO usuário palpite na mesma partida', async () => {
    await Prediction.create(validPrediction());
    const other = await Prediction.create(validPrediction({ userId: otherUser.id, choice: 'away' }));
    expect(other.id).toEqual(expect.any(String));
  });

  it('permite que o mesmo usuário palpite em OUTRA partida', async () => {
    await Prediction.create(validPrediction());

    const another = await Match.findOne({
      where: {
        status: 'scheduled',
        kickoffAt: { [Op.gt]: new Date() },
        id: { [Op.ne]: futureMatch.id },
      },
    });

    const second = await Prediction.create(validPrediction({ matchId: another.id }));
    expect(second.id).toEqual(expect.any(String));
  });

  it('resiste a duas gravações simultâneas (condição de corrida)', async () => {
    // Duas requisições paralelas do mesmo usuário: só uma pode vencer.
    const results = await Promise.allSettled([
      Prediction.create(validPrediction({ choice: 'home' })),
      Prediction.create(validPrediction({ choice: 'away' })),
    ]);

    const aceitas = results.filter((result) => result.status === 'fulfilled');
    expect(aceitas).toHaveLength(1);
    expect(await Prediction.count({ where: { userId: user.id, matchId: futureMatch.id } })).toBe(1);
  });
});

describe('faixa da aposta (RF08: de 1 a 10 pontos)', () => {
  it.each([0, -1, -500, 11, 100, 1000000])('recusa aposta de %i pontos', async (stake) => {
    await expectRejected(() => Prediction.create(validPrediction({ stake })));
  });

  it.each([1, 5, 10])('aceita aposta de %i pontos', async (stake) => {
    const prediction = await Prediction.create(validPrediction({ stake }));
    expect(prediction.stake).toBe(stake);
  });
});

describe('janela de palpite (RF41)', () => {
  it('recusa palpite em partida já encerrada', async () => {
    await expectRejected(() => Prediction.create(validPrediction({ matchId: finishedMatch.id })));
  });

  it('recusa palpite em partida cujo início já passou', async () => {
    const started = await Match.findOne({ where: { kickoffAt: { [Op.lte]: new Date() } } });
    await expectRejected(() => Prediction.create(validPrediction({ matchId: started.id })));
  });

  it('recusa palpite em partida ao vivo', async () => {
    // A partida muda de situação enquanto o palpite está sendo gravado.
    await futureMatch.update({ status: 'live' });
    try {
      await expectRejected(() => Prediction.create(validPrediction()));
    } finally {
      await futureMatch.update({ status: 'scheduled' });
    }
  });

  it('aceita palpite em partida que ainda não começou', async () => {
    const prediction = await Prediction.create(validPrediction());
    expect(prediction.status).toBe('pending');
  });

  it('permite apurar uma partida passada, que é o caminho legítimo', async () => {
    const settled = await Prediction.create({
      userId: user.id,
      matchId: finishedMatch.id,
      choice: 'home',
      stake: 5,
      status: 'won',
      pointsAwarded: 10,
      settledAt: new Date(),
    });
    expect(settled.pointsAwarded).toBe(10);
  });
});

describe('coerência entre situação e pontuação (RF09)', () => {
  it('recusa palpite perdido com pontos creditados', async () => {
    await expectRejected(() =>
      Prediction.create(
        validPrediction({
          matchId: finishedMatch.id,
          status: 'lost',
          pointsAwarded: 999,
          settledAt: new Date(),
        }),
      ),
    );
  });

  it('recusa palpite pendente com pontos creditados', async () => {
    await expectRejected(() => Prediction.create(validPrediction({ pointsAwarded: 50 })));
  });

  it('recusa palpite ganho sem pontuação', async () => {
    await expectRejected(() =>
      Prediction.create(
        validPrediction({
          matchId: finishedMatch.id,
          status: 'won',
          pointsAwarded: 0,
          settledAt: new Date(),
        }),
      ),
    );
  });

  it('recusa palpite apurado sem data de apuração', async () => {
    await expectRejected(() =>
      Prediction.create(
        validPrediction({ matchId: finishedMatch.id, status: 'won', pointsAwarded: 10 }),
      ),
    );
  });

  it('recusa placar palpitado negativo', async () => {
    await expectRejected(() => Prediction.create(validPrediction({ predictedHomeGoals: -2 })));
  });
});

describe('integridade das demais tabelas', () => {
  it('recusa pontuação negativa de usuário', async () => {
    await expectRejected(() => user.update({ points: -1 }));
  });

  it('recusa placar negativo', async () => {
    await expectRejected(() => finishedMatch.update({ homeGoals: -3 }));
  });

  it('recusa minuto fora de uma partida plausível', async () => {
    await expectRejected(() => finishedMatch.update({ minute: 9999 }));
  });

  it('recusa um time jogando contra si mesmo', async () => {
    await expectRejected(() => futureMatch.update({ awayTeamId: futureMatch.homeTeamId }));
  });

  it('recusa posição zero ou negativa no ranking', async () => {
    await expectRejected(() =>
      RankingSnapshot.create({
        userId: user.id,
        capturedOn: '2026-01-01',
        position: 0,
        points: 10,
      }),
    );
  });

  it('recusa dois retratos de ranking do mesmo usuário no mesmo dia', async () => {
    await RankingSnapshot.create({
      userId: user.id,
      capturedOn: '2026-01-02',
      position: 1,
      points: 10,
    });
    await expectRejected(() =>
      RankingSnapshot.create({
        userId: user.id,
        capturedOn: '2026-01-02',
        position: 2,
        points: 20,
      }),
    );
  });
});

describe('coerência do ranking com os palpites', () => {
  /**
   * A pontuação exibida no perfil e no ranking tem de ser a soma do que foi
   * realmente ganho. Número escolhido a dedo cria um sistema que não fecha:
   * basta uma consulta para mostrar que o ranking não corresponde a nada.
   */
  it('a pontuação de cada usuário é a soma dos palpites apurados', async () => {
    const { run: runSeed } = require('../../src/database/seed');
    await runSeed();

    const users = await User.findAll();
    expect(users.length).toBeGreaterThan(0);

    for (const current of users) {
      const soma = await Prediction.sum('pointsAwarded', {
        where: { userId: current.id, status: ['won', 'lost'] },
      });
      expect(current.points).toBe(soma || 0);
    }
  });

  it('nenhum palpite pendente em partida que já começou', async () => {
    const pendentes = await Prediction.findAll({
      where: { status: 'pending' },
      include: [{ model: Match, as: 'match' }],
    });

    pendentes.forEach((prediction) => {
      expect(new Date(prediction.match.kickoffAt).getTime()).toBeGreaterThan(Date.now());
    });
  });
});

describe('coerência do catálogo sincronizado', () => {
  it('nenhuma partida ao vivo com início no futuro', async () => {
    const incoerentes = await Match.count({
      where: { status: 'live', kickoffAt: { [Op.gt]: new Date() } },
    });
    expect(incoerentes).toBe(0);
  });

  it('nenhuma partida agendada com placar preenchido', async () => {
    const incoerentes = await Match.count({
      where: { status: 'scheduled', homeGoals: { [Op.ne]: null } },
    });
    expect(incoerentes).toBe(0);
  });

  it('nenhuma partida encerrada sem placar', async () => {
    const incoerentes = await Match.count({ where: { status: 'finished', homeGoals: null } });
    expect(incoerentes).toBe(0);
  });
});
