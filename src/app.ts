import onExit from 'signal-exit';
import schedule from 'node-schedule';
import driftLiquidationHistoryAccountUpdate from './events/liquidationHistoryAccountUpdate';
import {
  connect as connectDrift,
  destroy as destroyDrift,
} from './services/drift';
import logger from './services/logger';
import { getWalletFromPrivateKey } from './services/solana';
import { delay } from './services/utilities';
import { gm } from './scheduled/gm';
import { stats } from './scheduled/stats';

(async () => {
  logger.info('App starting');

  const wallet = getWalletFromPrivateKey(JSON.parse(process.env.WALLET_PRIVATE_KEY));

  let clearingHouseSubscription = false;
  while (!clearingHouseSubscription) {
    logger.debug('Connecting to Drift');
    try {
      clearingHouseSubscription = await connectDrift(wallet, [
        'liquidationHistoryAccount',
        'tradeHistoryAccount',
      ]);
    } catch (error) {
      logger.error(error);
      return;
    }

    if (!clearingHouseSubscription) {
      await delay(10000);
    }
  }

  schedule.scheduleJob(Object.assign(JSON.parse(process.env.TWEET_GM_SCHEDULE), {
    minute: Math.floor(Math.random() * 60),
  }), async () => {
    logger.info('Scheduled \'gm\' tweet');
    await gm();
  });

  schedule.scheduleJob(JSON.parse(process.env.TWEET_STATS_SCHEDULE), async () => {
    logger.info('Scheduled \'stats\' tweet');
    await stats();
  });

  //driftLiquidationHistoryAccountUpdate();
})();

process.once('uncaughtException', async (error: any) => {
  logger.error(error);
  destroyDrift();
  process.exit(1);
});

onExit((code: number | null, signal: string | null) => {
  logger.debug('Cleaning up app', code, signal);
  destroyDrift();
});
