export interface TierInfo {
  key: string;
  name: string;
  threshold: string;
}

export interface MetaResponse {
  leagues: string[];
  betTypes: string[];
  channels: string[];
  tiers: TierInfo[];
}

export interface SparkPoint {
  date: string;
  value: number;
}

export interface StatCard {
  id: string;
  label: string;
  value: number;
  unit: string;
  deltaPct: number;
  spark: SparkPoint[];
  accent: string;
}

export interface OverviewTotals {
  totalBet: number;
  totalPayout: number;
  activeUsers: number;
  payoutRatio: number;
  anomalyUsers: number;
  betCount: number;
}

export interface OverviewResponse {
  cards: StatCard[];
  totals: OverviewTotals;
}

export interface TierData {
  key: string;
  name: string;
  color: string;
  userCount: number;
  activeUsers: number;
  userPct: number;
  betAmount: number;
  betPct: number;
  avgBet: number;
}

export interface TierTrendItem {
  month: string;
  whale: number;
  middle: number;
  retail: number;
}

export interface TierResponse {
  tiers: TierData[];
  trend: TierTrendItem[];
}

export interface LeagueAmount {
  league: string;
  amount: number;
  count: number;
}

export interface TypeAmount {
  type: string;
  amount: number;
  count: number;
}

export interface MatrixRow {
  league: string;
  [key: string]: number | string;
}

export interface PreferenceResponse {
  leagues: LeagueAmount[];
  types: TypeAmount[];
  matrix: MatrixRow[];
}

export interface PnlSummary {
  totalBet: number;
  totalPayout: number;
  payoutRatio: number;
  netResult: number;
  status: 'normal' | 'warning' | 'danger';
}

export interface LeaguePnl {
  league: string;
  bet: number;
  payout: number;
  ratio: number;
}

export interface TypePnl {
  type: string;
  bet: number;
  payout: number;
  ratio: number;
}

export interface PnlTrendItem {
  month: string;
  bet: number;
  payout: number;
  ratio: number;
}

export interface PnlAlert {
  month: string;
  ratio: number;
  severity: 'warning' | 'danger';
  message: string;
}

export interface PnlResponse {
  summary: PnlSummary;
  byLeague: LeaguePnl[];
  byType: TypePnl[];
  trend: PnlTrendItem[];
  alerts: PnlAlert[];
}

export interface RetentionRate {
  key: string;
  label: string;
  value: number;
  prev: number;
}

export interface ChannelRetention {
  channel: string;
  users: number;
  d1: number;
  d7: number;
  d30: number;
}

export interface RetentionTrendItem {
  month: string;
  users: number;
  d1: number;
  d7: number;
  d30: number;
}

export interface RetentionResponse {
  rates: RetentionRate[];
  byChannel: ChannelRetention[];
  trend: RetentionTrendItem[];
}

export interface AnomalyUser {
  userId: string;
  nickname: string;
  tier: string;
  tierName: string;
  channel: string;
  reasons: string[];
  reasonLabels: string[];
  lateNightPct: number;
  betCount: number;
  totalAmount: number;
  maxDaily: number;
  lastBet: string;
}

export interface MonitorSummary {
  total: number;
  byType: Record<string, number>;
}

export interface MonitorResponse {
  summary: MonitorSummary;
  users: AnomalyUser[];
}

export interface Intervention {
  userId: string;
  action: string;
  status: string;
  operator: string;
  time: string;
}

export interface SystemUser {
  id: number;
  username: string;
  role: string;
  displayName: string;
  perms: Record<string, boolean>;
  lastLogin: string;
  status: string;
}

export interface AuthUser {
  username: string;
  role: string;
  displayName: string;
  perms: Record<string, boolean>;
}

export interface LoginResponse {
  ok: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

export interface LogEntry {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  ip: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  size: number;
}

export interface SearchUserResult {
  userId: string;
  nickname: string;
  tier: string;
  tierName: string;
  channel: string;
  reasons?: string[];
  reasonLabels?: string[];
}

export interface SearchUserResponse {
  items: SearchUserResult[];
}
