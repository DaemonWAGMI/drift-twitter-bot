import { DriftEnv } from '@drift-labs/sdk';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DRIFT_ENV: DriftEnv;
      LOG_LEVEL: string;
      RPC_ADDRESS: string;
      TWEET_FUNDING_SCHEDULE: string;
      TWEET_GM_SCHEDULE: string;
      TWEET_STATS_SCHEDULE: string;
      TWITTER_ACCESS_TOKEN_KEY: string;
      TWITTER_ACCESS_TOKEN_SECRET: string;
      TWITTER_CONSUMER_KEY: string;
      TWITTER_CONSUMER_SECRET: string;
      WALLET_PRIVATE_KEY: string;
    }
  }
}

export {}
