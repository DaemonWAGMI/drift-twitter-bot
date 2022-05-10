import moment from 'moment';
import {
  createLogger,
  format,
  transports,
} from 'winston';
import { isDevEnv } from './environment';
import { name } from '../../package.json';

const {
  combine,
  errors,
  json,
  prettyPrint,
  timestamp,
} = format;

export default createLogger({
  defaultMeta: {
    app: name,
  },
  format: combine(
    errors({
      stack: true,
    }),
    timestamp({
      format: moment.HTML5_FMT.DATETIME_LOCAL_SECONDS,
    }),
  ),
  transports: [
    new transports.Console({
      format: isDevEnv() ? prettyPrint() : json(),
      level: process.env.LOG_LEVEL,
    }),
  ],
});
