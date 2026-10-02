import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Notificação local disparada 5 minutos antes do início da partida (RF43).
 *
 * É agendada pelo sistema, não por um timer do app: um setTimeout morreria
 * assim que o processo fosse encerrado, e o usuário não receberia nada.
 *
 * A partir do SDK 53, `expo-notifications` lança ao ser avaliado dentro do
 * Expo Go: ele registra um listener de push remoto que o Expo Go deixou de
 * suportar. O erro nasce de forma assíncrona dentro da inicialização do
 * módulo, então um try/catch em volta do require NÃO o alcança — por isso
 * verificamos o ambiente ANTES de importar. Em development build ou em APK
 * de produção o módulo carrega normalmente e o agendamento funciona.
 */

/** Expo Go se identifica como `storeClient`. */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const MINUTES_BEFORE = 5;

/** Guarda qual notificação pertence a qual partida, para poder cancelar. */
const scheduled = new Map<string, string>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotificationsModule = any;

let cachedModule: NotificationsModule | null = null;
let loadFailed = false;

function loadNotifications(): NotificationsModule | null {
  if (cachedModule) return cachedModule;
  if (loadFailed) return null;

  // No Expo Go nem chegamos a tocar no módulo: importá-lo já derruba o app.
  if (isExpoGo) {
    loadFailed = true;
    if (__DEV__) {
      console.info(
        '[notificações] Expo Go não suporta expo-notifications desde o SDK 53; ' +
          'o aviso de início de partida (RF43) fica desativado. ' +
          'Use `npx expo run:android` ou um development build para habilitá-lo.',
      );
    }
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications');
    return cachedModule;
  } catch {
    loadFailed = true;
    return null;
  }
}

/** Indica se o agendamento está disponível neste ambiente de execução. */
export function notificationsAvailable(): boolean {
  return loadNotifications() !== null;
}

export async function configureNotifications(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Partidas',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    // Ambiente sem suporte: o app segue, apenas sem avisar o início da partida.
    loadFailed = true;
    return false;
  }
}

/**
 * Agenda o aviso de 5 minutos. Partida que começa em menos que isso não gera
 * notificação: ela dispararia no passado.
 */
export async function scheduleKickoffReminder(match: {
  id: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
}): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;

  const triggerAt = new Date(new Date(match.kickoffAt).getTime() - MINUTES_BEFORE * 60 * 1000);
  if (triggerAt.getTime() <= Date.now()) return null;

  await cancelKickoffReminder(match.id);

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${match.homeTeam} x ${match.awayTeam}`,
        body: `Começa em ${MINUTES_BEFORE} minutos`,
        data: { matchId: match.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerAt,
        channelId: Platform.OS === 'android' ? 'matches' : undefined,
      },
    });

    scheduled.set(match.id, identifier);
    return identifier;
  } catch {
    return null;
  }
}

export async function cancelKickoffReminder(matchId: string): Promise<void> {
  const Notifications = loadNotifications();
  const identifier = scheduled.get(matchId);
  if (!Notifications || !identifier) return;

  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
  scheduled.delete(matchId);
}

export function scheduledCount(): number {
  return scheduled.size;
}

export { MINUTES_BEFORE };
