import 'dotenv/config';

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv(process.env.PORT, 3001),
  ownerName: process.env.OWNER_NAME ?? 'Andrey',
  ownerAliases: (process.env.OWNER_ALIASES ?? 'andrey,andreysparksy')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  alertThreshold: numberFromEnv(process.env.ALERT_THRESHOLD, 3),
  alertWindowHours: numberFromEnv(process.env.ALERT_WINDOW_HOURS, 72),
  alertMinDistinctAuthors: numberFromEnv(process.env.ALERT_MIN_DISTINCT_AUTHORS, 2),
  alertDedupHours: numberFromEnv(process.env.ALERT_DEDUP_HOURS, 24),
};
