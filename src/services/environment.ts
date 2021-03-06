import dotenv from 'dotenv';

dotenv.config({
  ...(isDebug() && { debug: true, }),
  path: `./.env.${process.env.APP_ENV}`,
});

export const REQUIRED_ENV = [
  'APP_ENV',
  'DRIFT_ENV',
  'LOG_LEVEL',
  'RPC_ADDRESS',
  'TWEET_FUNDING_SCHEDULE',
  'TWEET_GM_SCHEDULE',
  'TWEET_STATS_SCHEDULE',
  'TWITTER_ACCESS_TOKEN_KEY',
  'TWITTER_ACCESS_TOKEN_SECRET',
  'TWITTER_CONSUMER_KEY',
  'TWITTER_CONSUMER_SECRET',
  'WALLET_PRIVATE_KEY',
];

export function isDebug(): boolean {
  return process.env.DEBUG === 'true';
}

export function isDevEnv(): boolean {
  return process.env.APP_ENV === 'dev';
}
