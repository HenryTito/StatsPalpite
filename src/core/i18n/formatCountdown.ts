/**
 * Formata o tempo restante até o início da partida (RF43).
 *
 * Devolve as unidades que importam em cada faixa: dias e horas quando falta
 * muito, minutos e segundos quando está perto. Mostrar "2d 4h 12m 35s" é
 * ruído; mostrar "35s" quando faltam dois dias é inútil.
 */
export type Countdown = {
  totalSeconds: number;
  started: boolean;
  /** Dentro da janela de 5 minutos que dispara a notificação local. */
  imminent: boolean;
  label: string;
};

const IMMINENT_THRESHOLD_SECONDS = 5 * 60;

export function formatCountdown(kickoffAt: string | Date, now: Date = new Date()): Countdown {
  const target = typeof kickoffAt === 'string' ? new Date(kickoffAt) : kickoffAt;
  const totalSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);

  if (totalSeconds <= 0) {
    return { totalSeconds: 0, started: true, imminent: false, label: '—' };
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let label: string;
  if (days > 0) label = `${days}d ${hours}h`;
  else if (hours > 0) label = `${hours}h ${String(minutes).padStart(2, '0')}min`;
  else if (minutes > 0) label = `${minutes}min ${String(seconds).padStart(2, '0')}s`;
  else label = `${seconds}s`;

  return {
    totalSeconds,
    started: false,
    imminent: totalSeconds <= IMMINENT_THRESHOLD_SECONDS,
    label,
  };
}

export { IMMINENT_THRESHOLD_SECONDS };
