/** Contratos de resposta da API, espelhando docs/api.md do backend. */

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  points: number;
  locale: string;
};

export type Session = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type Probability = {
  home: number;
  draw: number;
  away: number;
  confidence: number;
};

export type TeamRef = { id: string; name: string; shortName: string | null };

export type MatchSummary = {
  id: string;
  externalId: string;
  league: { id: string; name: string; country: string } | null;
  homeTeam: TeamRef | null;
  awayTeam: TeamRef | null;
  venue: { id: string; name: string; city: string | null } | null;
  kickoffAt: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  minute: number | null;
  score: { home: number | null; away: number | null };
  round: string | null;
  probability: Probability;
  form: { home: string[]; away: string[] };
  syncedAt: string | null;
  /** RF72: dados com mais de 48 horas sem sincronizar. */
  stale: boolean;
};

export type MatchStatistics = {
  homePossession: string | null;
  awayPossession: string | null;
  homeShots: string | null;
  awayShots: string | null;
  homeShotsOnTarget: string | null;
  awayShotsOnTarget: string | null;
  homeFouls: string | null;
  awayFouls: string | null;
  homeCorners: string | null;
  awayCorners: string | null;
  homeOffsides: string | null;
  awayOffsides: string | null;
  homePassAccuracy: string | null;
  awayPassAccuracy: string | null;
};

export type Weather = {
  temperatureC: number;
  feelsLikeC: number | null;
  condition: string;
  humidity: number | null;
  windKph: number | null;
  precipitationMm: number | null;
  observedFor: string;
};

export type MatchDetail = MatchSummary & {
  statistics: MatchStatistics | null;
  referee: {
    id: string;
    name: string;
    matchesOfficiated: number;
    averages: {
      fouls: string | null;
      yellowCards: string | null;
      redCards: string | null;
      penalties: string | null;
    };
  } | null;
  injuries: {
    id: string;
    teamId: string;
    player: { id: string; name: string } | null;
    reason: string;
    status: 'out' | 'doubtful' | 'suspended';
    reportedAt: string;
  }[];
  weather: Weather | null;
};

export type TeamComparison = {
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  record: { homeWins: number; draws: number; awayWins: number; played: number };
  goals: { for: number; against: number };
  form: {
    home: { results: string[]; score: number };
    away: { results: string[]; score: number };
  };
  probability: Probability;
  history: {
    id: string;
    kickoffAt: string;
    homeTeam: string;
    awayTeam: string;
    score: { home: number | null; away: number | null };
    league: string | null;
  }[];
};

export type SearchResult = {
  type: 'team' | 'player' | 'league' | 'venue';
  id: string;
  name: string;
  score: number;
};

export type GlobalSearchResponse = {
  query: string;
  total: number;
  suggestions: string[];
  results: SearchResult[];
};

export type PlayerResult = {
  id: string;
  name: string;
  position: string | null;
  team: { id: string; name: string; league: string | null } | null;
  statistics: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  };
  score: number;
};

export type VenueResult = {
  id: string;
  name: string;
  city: string | null;
  capacity: number | null;
  openedYear: number | null;
  coordinates: { latitude: number; longitude: number } | null;
};

export type RankingEntry = {
  position: number;
  userId: string;
  username: string;
  points: number;
};

export type UserPosition = {
  userId: string;
  username: string;
  position: number;
  points: number;
  pointsToClimb: number;
  leaderPoints: number;
};

export type RankingHistory = {
  userId: string;
  days: number;
  points: { date: string; position: number; points: number }[];
  change: number;
  best: number | null;
  worst: number | null;
};

export type DailyDigest = {
  date: string;
  totals: { matches: number; live: number; finished: number };
  highlights: (MatchSummary & {
    community: {
      home: number;
      draw: number;
      away: number;
      total: number;
      percentages?: { home: number; draw: number; away: number };
    } | null;
  })[];
  ranking: UserPosition | null;
};

export type RoundBulletin = {
  period: { from: string; to: string };
  totals: { matches: number; predictionsSettled: number };
  results: {
    id: string;
    league: string | null;
    homeTeam: string | null;
    awayTeam: string | null;
    score: { home: number | null; away: number | null };
    kickoffAt: string;
  }[];
  topPredictions: {
    username: string | null;
    match: string | null;
    choice: string;
    stake: number;
    pointsAwarded: number;
  }[];
  biggestMisses: {
    username: string | null;
    match: string | null;
    choice: string;
    stake: number;
    pointsAwarded: number;
  }[];
};
