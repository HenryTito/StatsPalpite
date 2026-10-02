import type { MatchSummary } from '../../../core/api/types';
import { formatCountdown } from '../../../core/i18n/formatCountdown';
import type { Partida } from '../../../modules/partidas/domain/Partida';

/**
 * Tradutor e formatador de hora, injetados pela tela. Manter a função pura
 * a deixa testável e evita que o adaptador dependa do contexto do React.
 */
export type PartidaFormatters = {
  t: (key: string, options?: Record<string, unknown>) => string;
  formatTime: (value: string | Date) => string;
};

/** Formatação padrão em pt-BR, usada quando a tela não injeta nada. */
const defaultFormatters: PartidaFormatters = {
  t: (key, options) => (key === 'home.startsIn' ? `em ${options?.time}` : key),
  formatTime: (value) =>
    new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
      typeof value === 'string' ? new Date(value) : value,
    ),
};

/**
 * Adapta a resposta da API para o tipo de domínio que os componentes de tela
 * consomem. É o ponto único onde o formato HTTP vira modelo do app — nenhum
 * componente conhece a forma da resposta.
 */
export function toPartida(
  match: MatchSummary,
  formatters: PartidaFormatters = defaultFormatters,
): Partida {
  const kickoff = new Date(match.kickoffAt);

  return {
    id: match.id,
    liga: match.league?.name ?? '—',
    mandante: match.homeTeam?.name ?? '—',
    visitante: match.awayTeam?.name ?? '—',
    status:
      match.status === 'live' ? 'ao-vivo' : match.status === 'finished' ? 'encerrada' : 'agendada',
    horario: horarioDe(match, kickoff, formatters),
    minuto: match.minute ?? undefined,
    placar:
      match.score.home === null || match.score.away === null
        ? undefined
        : { mandante: match.score.home, visitante: match.score.away },
    probabilidade: { mandante: match.probability.home, visitante: match.probability.away },
    confianca: match.probability.confidence,
  };
}

/**
 * Texto do canto superior direito do card.
 *
 * Partida ao vivo mostra o minuto; a que começa em menos de 24 h mostra a
 * contagem regressiva (RF43); as demais, o horário já localizado.
 */
function horarioDe(match: MatchSummary, kickoff: Date, formatters: PartidaFormatters): string {
  if (match.status === 'live') return `${match.minute ?? 0}'`;

  if (match.status === 'scheduled') {
    const countdown = formatCountdown(kickoff);
    if (!countdown.started && countdown.totalSeconds < 86400) {
      return formatters.t('home.startsIn', { time: countdown.label });
    }
  }

  return formatters.formatTime(kickoff);
}
