import dotenv from 'dotenv';

dotenv.config({
  debug: isDebug(),
  path: `./.env.${process.env.APP_ENV}`,
});

export function isDebug(): boolean {
  return process.env.DEBUG === 'true';
}

export function isDevEnv(): boolean {
  return process.env.APP_ENV === 'dev';
}
