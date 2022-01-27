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
    prettyPrint(),
    timestamp({
      format: `${moment.ISO_8601}`,
    }),
  ),
  transports: [
    new transports.Console({
      level: isDevEnv() ? 'debug' : 'warn',
    }),
  ],
});
