'use strict';

const logger = require('../config/logger');
const {
  sequelize,
  League,
  Venue,
  Team,
  Player,
  Referee,
  Match,
  MatchStatistic,
  Injury,
} = require('../models');
const { getIngestionEngine } = require('../providers');

/**
 * Leva os DTOs do motor de ingestão para o banco (B008).
 *
 * O motor cuida de fonte, cache e fallback; aqui só há persistência
 * idempotente: rodar duas vezes não duplica nada, porque tudo é resolvido
 * pelo externalId.
 */

/** Índice externalId -> id interno, para resolver as chaves estrangeiras. */
function indexBy(records, key = 'externalId') {
  return new Map(records.map((record) => [record[key], record.id]));
}

async function upsertLeagues(dtos, transaction) {
  for (const dto of dtos) {
    await League.findOrCreate({
      where: { externalId: dto.externalId },
      defaults: dto,
      transaction,
    }).then(([league, created]) => (created ? league : league.update(dto, { transaction })));
  }
  return League.findAll({ transaction });
}

async function upsertVenues(dtos, transaction) {
  for (const dto of dtos) {
    await Venue.findOrCreate({
      where: { externalId: dto.externalId },
      defaults: dto,
      transaction,
    }).then(([venue, created]) => (created ? venue : venue.update(dto, { transaction })));
  }
  return Venue.findAll({ transaction });
}

async function upsertTeams(dtos, { leagues, venues }, transaction) {
  for (const dto of dtos) {
    const payload = {
      externalId: dto.externalId,
      name: dto.name,
      shortName: dto.shortName,
      country: dto.country,
      logoUrl: dto.logoUrl,
      leagueId: leagues.get(dto.leagueExternalId) ?? null,
      venueId: venues.get(dto.venueExternalId) ?? null,
    };
    await Team.findOrCreate({
      where: { externalId: dto.externalId },
      defaults: payload,
      transaction,
    }).then(([team, created]) => (created ? team : team.update(payload, { transaction })));
  }
  return Team.findAll({ transaction });
}

async function upsertPlayers(dtos, { teams }, transaction) {
  for (const dto of dtos) {
    const payload = {
      externalId: dto.externalId,
      name: dto.name,
      position: dto.position,
      teamId: teams.get(dto.teamExternalId) ?? null,
      goals: dto.goals,
      assists: dto.assists,
      yellowCards: dto.yellowCards,
      redCards: dto.redCards,
      appearances: dto.appearances,
    };
    await Player.findOrCreate({
      where: { externalId: dto.externalId },
      defaults: payload,
      transaction,
    }).then(([player, created]) => (created ? player : player.update(payload, { transaction })));
  }
  return Player.findAll({ transaction });
}

async function upsertReferees(dtos, transaction) {
  for (const dto of dtos) {
    await Referee.findOrCreate({
      where: { externalId: dto.externalId },
      defaults: dto,
      transaction,
    }).then(([referee, created]) => (created ? referee : referee.update(dto, { transaction })));
  }
  return Referee.findAll({ transaction });
}

async function upsertMatches(dtos, { leagues, teams, venues, referees }, transaction) {
  let persisted = 0;
  let skipped = 0;

  for (const dto of dtos) {
    const leagueId = leagues.get(dto.leagueExternalId);
    const homeTeamId = teams.get(dto.homeTeamExternalId);
    const awayTeamId = teams.get(dto.awayTeamExternalId);

    // Partida cujo time ou liga não veio no mesmo lote fica para a próxima
    // sincronização: inserir com chave nula corromperia a listagem.
    if (!leagueId || !homeTeamId || !awayTeamId) {
      skipped += 1;
      continue;
    }

    const payload = {
      externalId: dto.externalId,
      leagueId,
      homeTeamId,
      awayTeamId,
      venueId: venues.get(dto.venueExternalId) ?? null,
      refereeId: referees.get(dto.refereeExternalId) ?? null,
      kickoffAt: dto.kickoffAt,
      status: dto.status,
      minute: dto.minute,
      homeGoals: dto.homeGoals,
      awayGoals: dto.awayGoals,
      round: dto.round,
      syncedAt: new Date(),
    };

    await Match.findOrCreate({
      where: { externalId: dto.externalId },
      defaults: payload,
      transaction,
    }).then(([match, created]) => (created ? match : match.update(payload, { transaction })));
    persisted += 1;
  }

  return { persisted, skipped };
}

async function upsertStatistics(dtos, { matches }, transaction) {
  let persisted = 0;
  for (const dto of dtos) {
    const matchId = matches.get(dto.matchExternalId);
    if (!matchId) continue;

    const { matchExternalId, ...metrics } = dto;
    await MatchStatistic.findOrCreate({
      where: { matchId },
      defaults: { matchId, ...metrics },
      transaction,
    }).then(([stat, created]) => (created ? stat : stat.update(metrics, { transaction })));
    persisted += 1;
  }
  return persisted;
}

async function replaceInjuries(dtos, { players, teams }, transaction) {
  // Desfalque é um retrato do momento: o lote novo substitui o anterior.
  await Injury.destroy({ where: {}, transaction });

  let persisted = 0;
  for (const dto of dtos) {
    const playerId = players.get(dto.playerExternalId);
    const teamId = teams.get(dto.teamExternalId);
    if (!playerId || !teamId) continue;

    await Injury.create(
      {
        playerId,
        teamId,
        reason: dto.reason,
        status: dto.status,
        reportedAt: dto.reportedAt,
      },
      { transaction },
    );
    persisted += 1;
  }
  return persisted;
}

/**
 * Sincronização completa. Tudo numa transação: um erro no meio não deixa o
 * banco com metade do catálogo novo e metade do antigo.
 *
 * @param {{from?: Date, to?: Date, engine?: object}} options
 */
async function syncAll({ from, to, engine = getIngestionEngine() } = {}) {
  const startedAt = Date.now();

  // Uma fonte só para todo o catálogo: misturar duas quebra as chaves externas.
  const catalog = await engine.getCatalog({ from, to });
  const {
    source,
    leagues: leagueDtos,
    venues: venueDtos,
    teams: teamDtos,
    players: playerDtos,
    referees: refereeDtos,
    matches: matchDtos,
    injuries: injuryDtos,
    statistics: statisticDtos,
  } = catalog;

  const summary = await sequelize.transaction(async (transaction) => {
    const leagues = indexBy(await upsertLeagues(leagueDtos, transaction));
    const venues = indexBy(await upsertVenues(venueDtos, transaction));
    const teams = indexBy(await upsertTeams(teamDtos, { leagues, venues }, transaction));
    const players = indexBy(await upsertPlayers(playerDtos, { teams }, transaction));
    const referees = indexBy(await upsertReferees(refereeDtos, transaction));

    const matchResult = await upsertMatches(
      matchDtos,
      { leagues, teams, venues, referees },
      transaction,
    );
    const matches = indexBy(await Match.findAll({ transaction }));

    const statistics = await upsertStatistics(statisticDtos, { matches }, transaction);
    const injuries = await replaceInjuries(injuryDtos, { players, teams }, transaction);

    return {
      leagues: leagues.size,
      venues: venues.size,
      teams: teams.size,
      players: players.size,
      referees: referees.size,
      matches: matchResult.persisted,
      matchesSkipped: matchResult.skipped,
      statistics,
      injuries,
    };
  });

  const durationMs = Date.now() - startedAt;
  logger.info('sincronização concluída', { ...summary, source, durationMs });
  return { ...summary, source, durationMs };
}

module.exports = { syncAll, indexBy };
