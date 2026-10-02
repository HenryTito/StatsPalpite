'use strict';

const FootballProvider = require('./FootballProvider');
const dataset = require('../dataset/footballDataset');
const translator = require('../translators/localTranslator');

/**
 * Fonte local. Serve o dataset em formato bruto e devolve DTOs pela mesma
 * camada anticorrupção que os adapters reais usarão.
 *
 * Existe por dois motivos: permite desenvolver e testar sem chave de API, e
 * é a fonte secundária natural do RNF11 quando a primária cai.
 */
class LocalFootballProvider extends FootballProvider {
  constructor({ referenceDate = new Date(), season = new Date().getFullYear() } = {}) {
    super();
    this.season = season;
    this.raw = dataset.build(referenceDate);
  }

  get name() {
    return 'local';
  }

  async healthCheck() {
    return true;
  }

  async fetchLeagues() {
    return this.raw.competicoes.map((league) => translator.toLeague(league, this.season));
  }

  async fetchVenues() {
    return this.raw.locais.map(translator.toVenue);
  }

  async fetchTeams() {
    return this.raw.clubes.map(translator.toTeam);
  }

  async fetchPlayers() {
    return this.raw.atletas.map(translator.toPlayer);
  }

  async fetchMatches({ from, to } = {}) {
    return this.raw.partidas
      .filter((match) => {
        if (!from && !to) return true;
        const kickoff = new Date(match.data_hora_utc);
        if (from && kickoff < from) return false;
        if (to && kickoff > to) return false;
        return true;
      })
      .map(translator.toMatch);
  }

  async fetchStatistics(matchExternalIds = null) {
    // null pede todas; uma lista (mesmo vazia) restringe ao que ela contém.
    const wanted =
      matchExternalIds === null || matchExternalIds === undefined
        ? null
        : new Set(matchExternalIds);
    return this.raw.estatisticas
      .filter((stat) => !wanted || wanted.has(stat.fixture_id))
      .map(translator.toStatistics);
  }

  async fetchInjuries() {
    return this.raw.desfalques.map(translator.toInjury);
  }

  async fetchReferees() {
    return this.raw.arbitros.map(translator.toReferee);
  }
}

module.exports = LocalFootballProvider;
