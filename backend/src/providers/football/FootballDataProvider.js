'use strict';

const FootballProvider = require('./FootballProvider');
const { getJson } = require('../http');

const BASE_URL = 'https://api.football-data.org/v4';

/**
 * O plano gratuito permite 10 requisições por minuto. Uma sincronização
 * completa faz mais que isso, então as chamadas são espaçadas; sem isso a
 * fonte devolve 429 no meio do lote e o catálogo chega pela metade.
 */
const MIN_INTERVAL_MS = 6500;

const STATUS_MAP = {
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
  IN_PLAY: 'live',
  PAUSED: 'live',
  FINISHED: 'finished',
  POSTPONED: 'postponed',
  SUSPENDED: 'postponed',
  CANCELLED: 'cancelled',
};

/**
 * Adapter do Football-Data.org, citado no documento para dados de lesões
 * (RF36). Aqui ele cumpre também o papel de FONTE SECUNDÁRIA do RNF11: tem
 * plano gratuito e cobre partidas e times das principais ligas.
 *
 * A tradução vive no próprio adapter porque é curta; quando crescer, migra
 * para src/providers/translators como as demais.
 */
class FootballDataProvider extends FootballProvider {
  constructor({ apiKey, competitions = ['BSA', 'PL', 'PD', 'CL'], minIntervalMs = MIN_INTERVAL_MS }) {
    super();
    if (!apiKey) throw new Error('FootballDataProvider exige uma API key');
    this.apiKey = apiKey;
    this.competitions = competitions;
    this.minIntervalMs = minIntervalMs;
    /** Momento da última chamada, para espaçar a seguinte. */
    this.lastRequestAt = 0;
    /** Fila serial: duas chamadas em paralelo furariam o espaçamento. */
    this.queue = Promise.resolve();
    /** O endpoint de times é consultado por fetchTeams e por fetchPlayers. */
    this.teamsCache = new Map();
  }

  /** Espera o tempo que falta para respeitar o intervalo mínimo. */
  async throttle() {
    const elapsed = Date.now() - this.lastRequestAt;
    const wait = this.minIntervalMs - elapsed;
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastRequestAt = Date.now();
  }

  get name() {
    return 'football-data';
  }

  get headers() {
    return { 'X-Auth-Token': this.apiKey };
  }

  async request(path, params = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });

    // Encadeia na fila para que as chamadas saiam uma de cada vez, espaçadas.
    const result = this.queue.then(async () => {
      await this.throttle();
      return getJson(url.toString(), { headers: this.headers, provider: this.name });
    });

    // A fila segue mesmo se esta chamada falhar.
    this.queue = result.catch(() => undefined);
    return result;
  }

  /** Times de uma competição, memorizados por instância. */
  async competitionTeams(code) {
    if (this.teamsCache.has(code)) return this.teamsCache.get(code);
    const body = await this.request(`/competitions/${code}/teams`);
    const teams = body.teams ?? [];
    this.teamsCache.set(code, teams);
    return teams;
  }

  async healthCheck() {
    try {
      await this.request('/competitions', { limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  async fetchLeagues() {
    const body = await this.request('/competitions');
    return (body.competitions ?? [])
      .filter((competition) => this.competitions.includes(competition.code))
      .map((competition) => ({
        externalId: competition.code,
        name: competition.name,
        country: competition.area?.name ?? 'Desconhecido',
        season: competition.currentSeason?.startDate
          ? new Date(competition.currentSeason.startDate).getFullYear()
          : new Date().getFullYear(),
        logoUrl: competition.emblem ?? null,
      }));
  }

  async fetchVenues() {
    // A API devolve o estádio apenas como texto, sem id nem coordenadas.
    return [];
  }

  async fetchTeams() {
    const teams = [];
    for (const code of this.competitions) {
      (await this.competitionTeams(code)).forEach((team) => {
        teams.push({
          externalId: String(team.id),
          name: team.name,
          shortName: team.tla ?? team.shortName ?? null,
          country: team.area?.name ?? null,
          logoUrl: team.crest ?? null,
          leagueExternalId: code,
          venueExternalId: null,
        });
      });
    }
    return teams;
  }

  async fetchPlayers() {
    const players = [];
    for (const code of this.competitions) {
      (await this.competitionTeams(code)).forEach((team) => {
        (team.squad ?? []).forEach((player) => {
          players.push({
            externalId: String(player.id),
            name: player.name,
            position: player.position ?? null,
            teamExternalId: String(team.id),
            // O plano gratuito não traz estatísticas individuais.
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            appearances: 0,
          });
        });
      });
    }
    return players;
  }

  async fetchMatches({ from, to } = {}) {
    const matches = [];
    for (const code of this.competitions) {
      const body = await this.request(`/competitions/${code}/matches`, {
        dateFrom: from ? from.toISOString().slice(0, 10) : undefined,
        dateTo: to ? to.toISOString().slice(0, 10) : undefined,
      });
      (body.matches ?? []).forEach((match) => {
        matches.push({
          externalId: String(match.id),
          leagueExternalId: code,
          homeTeamExternalId: String(match.homeTeam.id),
          awayTeamExternalId: String(match.awayTeam.id),
          venueExternalId: null,
          refereeExternalId: match.referees?.[0]?.id ? String(match.referees[0].id) : null,
          kickoffAt: match.utcDate,
          status: STATUS_MAP[match.status] ?? 'scheduled',
          minute: match.minute ?? null,
          homeGoals: match.score?.fullTime?.home ?? null,
          awayGoals: match.score?.fullTime?.away ?? null,
          round: match.matchday ? `Rodada ${match.matchday}` : null,
        });
      });
    }
    return matches;
  }

  async fetchStatistics() {
    // Estatísticas detalhadas não existem no plano gratuito.
    return [];
  }

  async fetchInjuries() {
    return [];
  }

  async fetchReferees() {
    return [];
  }
}

module.exports = FootballDataProvider;
