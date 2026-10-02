import { api } from '../../core/api/client';
import { tokenStorage } from '../../core/api/tokenStorage';
import type {
  DailyDigest,
  GlobalSearchResponse,
  MatchDetail,
  MatchSummary,
  PlayerResult,
  RankingEntry,
  RankingHistory,
  RoundBulletin,
  Session,
  TeamComparison,
  UserPosition,
  VenueResult,
} from '../../core/api/types';

/**
 * Implementacao dos repositorios contra a API. As telas dependem destes
 * objetos, nunca do cliente HTTP diretamente.
 */

export const authRepository = {
  async register(input: {
    email: string;
    username: string;
    password: string;
    passwordConfirmation: string;
    birthDate: string;
  }): Promise<Session> {
    const session = await api.post<Session>('/auth/register', input);
    await tokenStorage.save(session);
    return session;
  },

  async login(input: { email: string; password: string }): Promise<Session> {
    const session = await api.post<Session>('/auth/login', input);
    await tokenStorage.save(session);
    return session;
  },

  async logout(): Promise<void> {
    const stored = await tokenStorage.load();
    if (stored) {
      await api.post('/auth/logout', { refreshToken: stored.refreshToken }).catch(() => undefined);
    }
    await tokenStorage.clear();
  },

  me: () => api.get<{ user: Session['user'] }>('/auth/me', { authenticated: true }),

  checkUsername: (username: string) =>
    api.get<{ available: boolean; reason?: string }>('/auth/username-available', {
      query: { username },
    }),

  forgotPassword: (email: string) =>
    api.post<{ message: string; token?: string }>('/auth/forgot-password', { email }),

  resetPassword: (input: { token: string; password: string; passwordConfirmation: string }) =>
    api.post<{ message: string }>('/auth/reset-password', input),
};

export const matchRepository = {
  list: (query: { date?: string; leagueId?: string; teamId?: string; status?: string } = {}) =>
    api.get<{ total: number; date: string; matches: MatchSummary[] }>('/matches', { query }),

  detail: (id: string) => api.get<MatchDetail>(`/matches/${id}`),

  compare: (homeTeamId: string, awayTeamId: string) =>
    api.get<TeamComparison>('/compare', { query: { homeTeamId, awayTeamId } }),

  venues: () => api.get<{ venues: VenueResult[] }>('/venues'),

  leagues: () =>
    api.get<{ leagues: { id: string; name: string; country: string; season: number }[] }>(
      '/leagues',
    ),
};

export const searchRepository = {
  global: (q: string, types?: string) =>
    api.get<GlobalSearchResponse>('/search', { query: { q, types } }),

  players: (q: string) =>
    api.get<{ query: string; total: number; results: PlayerResult[] }>('/search/players', {
      query: { q },
    }),
};

export const rankingRepository = {
  list: (query: { limit?: number; offset?: number } = {}) =>
    api.get<{ total: number; entries: RankingEntry[] }>('/ranking', { query }),

  myPosition: () => api.get<UserPosition>('/ranking/me', { authenticated: true }),

  myHistory: (days = 30) =>
    api.get<RankingHistory>('/ranking/me/history', { query: { days }, authenticated: true }),
};

export const digestRepository = {
  daily: (date?: string) =>
    api.get<DailyDigest>('/digest/daily', { query: { date }, authenticated: true }),

  previousRound: (days = 7) =>
    api.get<RoundBulletin>('/digest/previous-round', { query: { days } }),
};
