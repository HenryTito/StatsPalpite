'use strict';

/**
 * Contratos do domínio produzidos pela camada anticorrupção.
 *
 * Nenhum campo aqui carrega o formato de uma fonte específica. Trocar
 * API-Football por Football-Data altera apenas um tradutor; serviços,
 * controllers e banco continuam iguais.
 *
 * @typedef {Object} LeagueDTO
 * @property {string} externalId
 * @property {string} name
 * @property {string} country
 * @property {number} season
 * @property {string|null} logoUrl
 *
 * @typedef {Object} VenueDTO
 * @property {string} externalId
 * @property {string} name
 * @property {string|null} city
 * @property {number|null} capacity
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {number|null} openedYear
 *
 * @typedef {Object} TeamDTO
 * @property {string} externalId
 * @property {string} name
 * @property {string|null} shortName
 * @property {string|null} country
 * @property {string|null} logoUrl
 * @property {string|null} leagueExternalId
 * @property {string|null} venueExternalId
 *
 * @typedef {Object} MatchDTO
 * @property {string} externalId
 * @property {string} leagueExternalId
 * @property {string} homeTeamExternalId
 * @property {string} awayTeamExternalId
 * @property {string|null} venueExternalId
 * @property {string|null} refereeExternalId
 * @property {string} kickoffAt  ISO 8601
 * @property {'scheduled'|'live'|'finished'|'postponed'|'cancelled'} status
 * @property {number|null} minute
 * @property {number|null} homeGoals
 * @property {number|null} awayGoals
 * @property {string|null} round
 *
 * @typedef {Object} MatchStatisticsDTO
 * @property {string} matchExternalId
 * @property {number|null} homePossession
 * @property {number|null} awayPossession
 * @property {number|null} homeShots
 * @property {number|null} awayShots
 * @property {number|null} homeShotsOnTarget
 * @property {number|null} awayShotsOnTarget
 * @property {number|null} homeFouls
 * @property {number|null} awayFouls
 * @property {number|null} homeCorners
 * @property {number|null} awayCorners
 * @property {number|null} homeOffsides
 * @property {number|null} awayOffsides
 * @property {number|null} homePassAccuracy
 * @property {number|null} awayPassAccuracy
 *
 * @typedef {Object} InjuryDTO
 * @property {string} playerExternalId
 * @property {string} playerName
 * @property {string} teamExternalId
 * @property {string} reason
 * @property {'out'|'doubtful'|'suspended'} status
 * @property {string} reportedAt  ISO 8601
 *
 * @typedef {Object} RefereeDTO
 * @property {string} externalId
 * @property {string} name
 * @property {string|null} country
 * @property {number} matchesOfficiated
 * @property {number|null} avgFouls
 * @property {number|null} avgYellowCards
 * @property {number|null} avgRedCards
 * @property {number|null} avgPenalties
 *
 * @typedef {Object} WeatherDTO
 * @property {number} temperatureC
 * @property {number|null} feelsLikeC
 * @property {string} condition
 * @property {number|null} humidity
 * @property {number|null} windKph
 * @property {number|null} precipitationMm
 * @property {string} observedFor  ISO 8601
 */

/** Status de partida aceitos no domínio. */
const MATCH_STATUS = Object.freeze(['scheduled', 'live', 'finished', 'postponed', 'cancelled']);

/** Status de desfalque aceitos no domínio. */
const INJURY_STATUS = Object.freeze(['out', 'doubtful', 'suspended']);

module.exports = { MATCH_STATUS, INJURY_STATUS };
