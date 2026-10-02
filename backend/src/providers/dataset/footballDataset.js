'use strict';

/**
 * Conjunto de dados local no FORMATO BRUTO de uma fonte externa — com nomes
 * de campo estranhos e aninhamento de propósito. Ele existe para que a camada
 * anticorrupção seja exercitada de verdade, e não apenas declarada.
 *
 * Determinístico: o gerador usa um PRNG com semente fixa, então duas execuções
 * produzem exatamente os mesmos números, e os testes podem afirmar valores.
 */

/** PRNG mulberry32: pequeno, determinístico, suficiente para dados de exemplo. */
function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20260101);

const between = (min, max) => min + random() * (max - min);
const intBetween = (min, max) => Math.floor(between(min, max + 1));
const pick = (list) => list[Math.floor(random() * list.length)];
const round1 = (value) => Math.round(value * 10) / 10;

const LEAGUES = [
  { id: 'L-BRA-A', nome: 'Brasileirão Série A', pais: 'Brasil' },
  { id: 'L-ENG-PL', nome: 'Premier League', pais: 'Inglaterra' },
  { id: 'L-ESP-LL', nome: 'La Liga', pais: 'Espanha' },
  { id: 'L-SA-LIB', nome: 'Libertadores', pais: 'América do Sul' },
];

const VENUES = [
  { id: 'V-ALZ', nome: 'Allianz Parque', cidade: 'São Paulo', cap: 43713, lat: -23.5275, lon: -46.6786, ano: 2014 },
  { id: 'V-VLB', nome: 'Vila Belmiro', cidade: 'Santos', cap: 16068, lat: -23.9507, lon: -46.3381, ano: 1916 },
  { id: 'V-MAR', nome: 'Maracanã', cidade: 'Rio de Janeiro', cap: 78838, lat: -22.9121, lon: -43.2302, ano: 1950 },
  { id: 'V-SJC', nome: 'São Januário', cidade: 'Rio de Janeiro', cap: 21880, lat: -22.8900, lon: -43.2277, ano: 1927 },
  { id: 'V-ARG', nome: 'Arena do Grêmio', cidade: 'Porto Alegre', cap: 55662, lat: -29.9742, lon: -51.1953, ano: 2012 },
  { id: 'V-BEI', nome: 'Beira-Rio', cidade: 'Porto Alegre', cap: 50128, lat: -30.0654, lon: -51.2359, ano: 1969 },
  { id: 'V-EMI', nome: 'Emirates Stadium', cidade: 'Londres', cap: 60704, lat: 51.5549, lon: -0.1084, ano: 2006 },
  { id: 'V-STB', nome: 'Stamford Bridge', cidade: 'Londres', cap: 40343, lat: 51.4817, lon: -0.1910, ano: 1877 },
  { id: 'V-ANF', nome: 'Anfield', cidade: 'Liverpool', cap: 61276, lat: 53.4308, lon: -2.9609, ano: 1884 },
  { id: 'V-ETI', nome: 'Etihad Stadium', cidade: 'Manchester', cap: 53400, lat: 53.4831, lon: -2.2004, ano: 2003 },
  { id: 'V-BER', nome: 'Santiago Bernabéu', cidade: 'Madri', cap: 81044, lat: 40.4531, lon: -3.6883, ano: 1947 },
  { id: 'V-CAM', nome: 'Spotify Camp Nou', cidade: 'Barcelona', cap: 99354, lat: 41.3809, lon: 2.1228, ano: 1957 },
  { id: 'V-BVI', nome: 'Benito Villamarín', cidade: 'Sevilha', cap: 60721, lat: 37.3564, lon: -5.9816, ano: 1929 },
  { id: 'V-MON', nome: 'La Bombonera', cidade: 'Buenos Aires', cap: 54000, lat: -34.6356, lon: -58.3647, ano: 1940 },
];

const TEAMS = [
  { id: 'T-PAL', nome: 'Palmeiras', sigla: 'PAL', liga: 'L-BRA-A', estadio: 'V-ALZ', pais: 'Brasil' },
  { id: 'T-SAN', nome: 'Santos', sigla: 'SAN', liga: 'L-BRA-A', estadio: 'V-VLB', pais: 'Brasil' },
  { id: 'T-FLA', nome: 'Flamengo', sigla: 'FLA', liga: 'L-BRA-A', estadio: 'V-MAR', pais: 'Brasil' },
  { id: 'T-VAS', nome: 'Vasco da Gama', sigla: 'VAS', liga: 'L-BRA-A', estadio: 'V-SJC', pais: 'Brasil' },
  { id: 'T-GRE', nome: 'Grêmio', sigla: 'GRE', liga: 'L-BRA-A', estadio: 'V-ARG', pais: 'Brasil' },
  { id: 'T-INT', nome: 'Internacional', sigla: 'INT', liga: 'L-BRA-A', estadio: 'V-BEI', pais: 'Brasil' },
  { id: 'T-ARS', nome: 'Arsenal', sigla: 'ARS', liga: 'L-ENG-PL', estadio: 'V-EMI', pais: 'Inglaterra' },
  { id: 'T-CHE', nome: 'Chelsea', sigla: 'CHE', liga: 'L-ENG-PL', estadio: 'V-STB', pais: 'Inglaterra' },
  { id: 'T-LIV', nome: 'Liverpool', sigla: 'LIV', liga: 'L-ENG-PL', estadio: 'V-ANF', pais: 'Inglaterra' },
  { id: 'T-MCI', nome: 'Manchester City', sigla: 'MCI', liga: 'L-ENG-PL', estadio: 'V-ETI', pais: 'Inglaterra' },
  { id: 'T-RMA', nome: 'Real Madrid', sigla: 'RMA', liga: 'L-ESP-LL', estadio: 'V-BER', pais: 'Espanha' },
  { id: 'T-BAR', nome: 'Barcelona', sigla: 'BAR', liga: 'L-ESP-LL', estadio: 'V-CAM', pais: 'Espanha' },
  { id: 'T-BET', nome: 'Real Betis', sigla: 'BET', liga: 'L-ESP-LL', estadio: 'V-BVI', pais: 'Espanha' },
  { id: 'T-BOC', nome: 'Boca Juniors', sigla: 'BOC', liga: 'L-SA-LIB', estadio: 'V-MON', pais: 'Argentina' },
];

const FIRST_NAMES = ['Lucas', 'Gabriel', 'Rafael', 'Thiago', 'Bruno', 'Diego', 'Matheus', 'André', 'Felipe', 'Rodrigo', 'Vinícius', 'Éder', 'João', 'Caio'];
const LAST_NAMES = ['Silva', 'Souza', 'Pereira', 'Almeida', 'Costa', 'Ribeiro', 'Martins', 'Barbosa', 'Rocha', 'Fernandes', 'Carvalho', 'Nogueira'];
const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];

const REFEREES = [
  { id: 'R-001', nome: 'Anderson Daronco', pais: 'Brasil' },
  { id: 'R-002', nome: 'Raphael Claus', pais: 'Brasil' },
  { id: 'R-003', nome: 'Michael Oliver', pais: 'Inglaterra' },
  { id: 'R-004', nome: 'Antonio Mateu Lahoz', pais: 'Espanha' },
];

const INJURY_REASONS = [
  ['Lesão na coxa', 'OUT'],
  ['Entorse de tornozelo', 'OUT'],
  ['Desconforto muscular', 'DOUBTFUL'],
  ['Terceiro cartão amarelo', 'SUSPENDED'],
  ['Virose', 'DOUBTFUL'],
];

/** Gera o elenco de cada time, com estatísticas de temporada plausíveis. */
function buildPlayers() {
  const players = [];
  TEAMS.forEach((team) => {
    for (let index = 0; index < 11; index += 1) {
      const position = POSITIONS[Math.min(index, POSITIONS.length - 1)];
      const attacking = position === 'Atacante' || position === 'Meia';
      players.push({
        id: `P-${team.sigla}-${String(index + 1).padStart(2, '0')}`,
        nome_completo: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        posicao: position,
        time_id: team.id,
        temporada: {
          gols: attacking ? intBetween(2, 18) : intBetween(0, 3),
          assistencias: attacking ? intBetween(1, 12) : intBetween(0, 4),
          cartoes: { amarelo: intBetween(0, 9), vermelho: intBetween(0, 1) },
          jogos: intBetween(14, 32),
        },
      });
    }
  });
  return players;
}

/** Gera o calendário: passado encerrado, hoje em vários estados, futuro agendado. */
function buildMatches(referenceDate) {
  const matches = [];
  const base = new Date(referenceDate);
  base.setUTCHours(0, 0, 0, 0);

  const byLeague = LEAGUES.map((league) => ({
    league,
    teams: TEAMS.filter((team) => team.liga === league.id),
  })).filter((entry) => entry.teams.length >= 2);

  let sequence = 0;
  // 24 rodadas: 20 no passado, 1 hoje, 3 no futuro.
  for (let offset = -20; offset <= 3; offset += 1) {
    byLeague.forEach(({ league, teams }) => {
      for (let pairIndex = 0; pairIndex + 1 < teams.length; pairIndex += 2) {
        // A cada rodada inverte o mando de campo, gerando confrontos nos dois sentidos.
        const flip = (offset + pairIndex) % 2 === 0;
        const home = flip ? teams[pairIndex] : teams[pairIndex + 1];
        const away = flip ? teams[pairIndex + 1] : teams[pairIndex];

        const kickoff = new Date(base);
        kickoff.setUTCDate(kickoff.getUTCDate() + offset);
        kickoff.setUTCHours(19 + (pairIndex % 3), 0, 0, 0);

        sequence += 1;
        const isPast = offset < 0;
        const isToday = offset === 0;
        // Hoje: o primeiro confronto de cada liga entra ao vivo.
        const live = isToday && pairIndex === 0;

        matches.push({
          fixture_id: `M-${String(sequence).padStart(5, '0')}`,
          competicao: league.id,
          mandante: home.id,
          visitante: away.id,
          local: home.estadio,
          arbitro: pick(REFEREES).id,
          data_hora_utc: kickoff.toISOString(),
          situacao: isPast ? 'FT' : live ? 'LIVE' : 'NS',
          minuto_atual: live ? intBetween(12, 80) : null,
          placar: isPast
            ? { casa: intBetween(0, 4), fora: intBetween(0, 3) }
            : live
              ? { casa: intBetween(0, 2), fora: intBetween(0, 2) }
              : null,
          rodada: `Rodada ${offset + 21}`,
        });
      }
    });
  }
  return matches;
}

/** Estatísticas por partida, com soma de posse fechando em 100%. */
function buildStatistics(matches) {
  return matches
    .filter((match) => match.situacao !== 'NS')
    .map((match) => {
      const homePossession = round1(between(38, 62));
      return {
        fixture_id: match.fixture_id,
        casa: {
          posse_bola: `${homePossession}%`,
          finalizacoes: intBetween(5, 20),
          finalizacoes_no_gol: intBetween(1, 9),
          faltas: intBetween(6, 20),
          escanteios: intBetween(1, 11),
          impedimentos: intBetween(0, 6),
          precisao_passes: `${round1(between(70, 92))}%`,
        },
        fora: {
          posse_bola: `${round1(100 - homePossession)}%`,
          finalizacoes: intBetween(4, 18),
          finalizacoes_no_gol: intBetween(1, 8),
          faltas: intBetween(6, 20),
          escanteios: intBetween(1, 10),
          impedimentos: intBetween(0, 6),
          precisao_passes: `${round1(between(68, 90))}%`,
        },
      };
    });
}

function buildInjuries(players) {
  const injuries = [];
  TEAMS.forEach((team) => {
    const squad = players.filter((player) => player.time_id === team.id);
    const count = intBetween(0, 3);
    for (let index = 0; index < count; index += 1) {
      const player = squad[index];
      if (!player) continue;
      const [reason, status] = pick(INJURY_REASONS);
      injuries.push({
        jogador_id: player.id,
        jogador_nome: player.nome_completo,
        clube_id: team.id,
        motivo: reason,
        situacao: status,
        data_reporte: new Date(Date.now() - intBetween(1, 10) * 86400000).toISOString(),
      });
    }
  });
  return injuries;
}

function buildReferees() {
  return REFEREES.map((referee) => ({
    arbitro_id: referee.id,
    nome: referee.nome,
    pais: referee.pais,
    apitos: intBetween(40, 180),
    medias: {
      faltas: round1(between(18, 30)),
      amarelos: round1(between(2.5, 6.5)),
      vermelhos: round1(between(0.05, 0.5)),
      penaltis: round1(between(0.1, 0.6)),
    },
  }));
}

function build(referenceDate = new Date()) {
  const players = buildPlayers();
  const matches = buildMatches(referenceDate);
  return {
    competicoes: LEAGUES,
    locais: VENUES,
    clubes: TEAMS,
    atletas: players,
    partidas: matches,
    estatisticas: buildStatistics(matches),
    desfalques: buildInjuries(players),
    arbitros: buildReferees(),
  };
}

module.exports = { build, LEAGUES, TEAMS, VENUES, REFEREES };
