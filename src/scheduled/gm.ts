import emoji from 'node-emoji';
import { isDevEnv } from '../services/environment';
import logger from '../services/logger';
import {
  reportTwitterError,
  tweet,
} from '../services/twitter';

export async function gm() {
  const status = `gm driftoooors ${emoji.get('sunny')}`;
  if (!isDevEnv()) {
    let response;
    try {
      response = await tweet({
        status,
      });
    } catch (error) {
      reportTwitterError(error);
      return;
    }
    logger.debug(`Tweeted (${status.length} characters): https://twitter.com/DriftFuturesBot/status/${response.id_str}`);
  } else {
    logger.debug(`Tweeted (${status.length} characters):

${status}`);
  }
}
