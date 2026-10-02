'use strict';

const FootballProvider = require('./FootballProvider');
const translator = require('../translators/apiFootballTranslator');
const { getJson, ProviderError } = require('../http');

const BASE_URL = 'https://v3.football.api-sports.io';

/** Formata uma data como YYYY-MM-DD, formato aceito pelo parâmetro `date`. */
function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Adapter da API-Football, a fonte citada no documento de requisitos
 * (RF03, RF04, RF36). Só entra em uso quando API_FOOTBALL_KEY está definida.
 */
class ApiFootballProvider extends FootballProvider {
  constructor({ apiKey, leagueIds = [], season = new Date().getFullYear() }) {
    super();
    if (!apiKey) throw new Error('ApiFootballProvider exige uma API key');
    this.apiKey = apiKey;
    this.leagueIds = leagueIds;
    this.season = season;
  }

  get name() {
    return 'api-football';
  }

  get headers() {
    return { 'x-apisports-key': this.apiKey };
  }

  async request(path, params = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
    const body = await getJson(url.toString(), { headers: this.headers, provider: this.name });
    // A API responde 200 com a lista de erros preenchida; sem isto, falhas passam batido.
    const errors = body?.errors;
    const hasErrors = Array.isArray(errors)
      ? errors.length > 0
      : errors && Object.keys(errors).length > 0;
    if (hasErrors) {
      throw new ProviderError(this.name, `erro da fonte: ${JSON.stringify(errors)}`);
    }
    return body?.response ?? [];
  }

  async healthCheck() {
    try {
      await this.request('/status');
      return true;
    } catch {
      return false;
    }
  }

  async fetchLeagues() {
    const response = await this.request('/leagues', { current: 'true' });
    return response.map(translator.toLeague);
  }

  async fetchVenues() {
    const venues = [];
    for (const leagueId of this.leagueIds) {
      const teams = await this.request('/teams', { league: leagueId, season: this.season });
      teams.forEach((entry) => {
        if (entry.venue?.id) venues.push(translator.toVenue(entry.venue));
      });
    }
    return venues;
  }

  async fetchTeams() {
    const teams = [];
    for (const leagueId of this.leagueIds) {
      const response = await this.request('/teams', { league: leagueId, season: this.season });
      response.forEach((entry) => {
        teams.push(translator.toTeam({ ...entry, leagueExternalId: leagueId }));
      });
    }
    return teams;
  }

  async fetchPlayers() {
    const players = [];
    for (const leagueId of this.leagueIds) {
      const response = await this.request('/players', {
        league: leagueId,
        season: this.season,
        page: 1,
      });
      response.forEach((entry) => players.push(translator.toPlayer(entry)));
    }
    return players;
  }

  async fetchMatches({ from, to } = {}) {
    const matches = [];
    for (const leagueId of this.leagueIds) {
      const response = await this.request('/fixtures', {
        league: leagueId,
        season: this.season,
        from: from ? isoDate(from) : undefined,
        to: to ? isoDate(to) : undefined,
      });
      response.forEach((entry) => matches.push(translator.toMatch(entry)));
    }
    return matches;
  }

  async fetchStatistics(matchExternalIds = null) {
    const statistics = [];
    // Esta fonte exige um id por requisição, então null não tem como pedir "todas".
    for (const fixtureId of matchExternalIds ?? []) {
      const response = await this.request('/fixtures/statistics', { fixture: fixtureId });
      if (response.length) {
        statistics.push(translator.toStatistics({ fixtureId, statistics: response }));
      }
    }
    return statistics;
  }

  async fetchInjuries() {
    const injuries = [];
    for (const leagueId of this.leagueIds) {
      const response = await this.request('/injuries', { league: leagueId, season: this.season });
      response.forEach((entry) => injuries.push(translator.toInjury(entry)));
    }
    return injuries;
  }

  async fetchReferees() {
    // A API-Football não expõe estatísticas de arbitragem; o RF62 depende da
    // fonte secundária ou da local. Devolver vazio permite ao motor seguir.
    return [];
  }
}

module.exports = ApiFootballProvider;
