'use strict';

/**
 * Contrato que todo provedor de dados de futebol precisa honrar.
 *
 * Os métodos devolvem DTOs de contracts.js — nunca o formato da fonte. É esse
 * contrato que permite ao RNF11 trocar de fonte sem avisar ninguém.
 */
class FootballProvider {
  /** Nome curto usado em log e em métricas de fallback. */
  get name() {
    throw new Error('não implementado');
  }

  /** @returns {Promise<boolean>} se a fonte está respondendo. */
  async healthCheck() {
    return true;
  }

  /** @returns {Promise<import('../contracts').LeagueDTO[]>} */
  async fetchLeagues() {
    throw new Error('não implementado');
  }

  /** @returns {Promise<import('../contracts').VenueDTO[]>} */
  async fetchVenues() {
    throw new Error('não implementado');
  }

  /** @returns {Promise<import('../contracts').TeamDTO[]>} */
  async fetchTeams() {
    throw new Error('não implementado');
  }

  async fetchPlayers() {
    throw new Error('não implementado');
  }

  /** @param {{from: Date, to: Date}} range */
  // eslint-disable-next-line no-unused-vars
  async fetchMatches(range) {
    throw new Error('não implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async fetchStatistics(matchExternalIds) {
    throw new Error('não implementado');
  }

  async fetchInjuries() {
    throw new Error('não implementado');
  }

  async fetchReferees() {
    throw new Error('não implementado');
  }
}

module.exports = FootballProvider;
