import emoji from 'node-emoji';
import {
  QUOTE_PRECISION,
  ZERO,
  Market,
  calculateInsuranceFundSize,
  convertBaseAssetAmountToNumber,
  convertToNumber,
  initialize,
} from '@drift-labs/sdk';
import { PublicKey } from '@solana/web3.js';
import {
  TWAP_PRECISION,
  ClearingHouseSubscription,
  MarketsAccountData,
  StateAccountData,
  isDriftConnected,
} from '../services/drift';
import { isDevEnv } from '../services/environment';
import logger from '../services/logger';
import { connection as rpcConnection } from '../services/solana';
import {
  reportTwitterError,
  tweet,
} from '../services/twitter';

export async function stats() {
  if (!isDriftConnected) {
    logger.error('Drift is not connected');
    return;
  }

  if (ClearingHouseSubscription === undefined) {
    logger.error('ClearingHouse subscription is not active');
    return;
  }

  if (MarketsAccountData === undefined) {
    logger.error('Market data is not available');
    return;
  }

  if (StateAccountData === undefined) {
    logger.error('State data is not available');
    return;
  }

  const initializedMarkets: Market[] = MarketsAccountData?.markets.filter(({ initialized }) => initialized === true);
  const collateralBalance = await rpcConnection.getTokenAccountBalance(new PublicKey(StateAccountData.collateralVault));
  const feesBalance = initializedMarkets.reduce((feesAmount, market) => feesAmount.add(market.amm.totalFee), ZERO);
  const insuranceBalance = await calculateInsuranceFundSize(rpcConnection, StateAccountData, MarketsAccountData);
  const openInterestPositions = initializedMarkets.reduce((openInterestPositions, { openInterest }) => openInterestPositions.add(openInterest), ZERO);
  const openInterestValue = initializedMarkets.reduce((openInterestValue, market) => {
    const {
      amm: {
        lastMarkPriceTwap,
      },
      baseAssetAmountLong,
      baseAssetAmountShort,
      openInterest,
    } = market;

    return openInterestValue + convertBaseAssetAmountToNumber(baseAssetAmountLong.sub(baseAssetAmountShort)) * convertToNumber(lastMarkPriceTwap, TWAP_PRECISION);
  }, 0);

  let users;
  try {
    users = await ClearingHouseSubscription.program.account.user.all();
  } catch (error: any) {
    logger.error(error, { stack: new Error().stack });
    return;
  }

  const {
    value: {
      uiAmount: collateralUSD,
    },
  } = collateralBalance;

  const status = `Current @DriftProtocol stats:

  • Driftoooors: ${users.length.toLocaleString('en-US')} ${emoji.get('space_invader')}
  ${collateralUSD ? `• Collateral: ${collateralUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : ''}
  • Open Interest: ${openInterestPositions.toNumber().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} positions, ${openInterestValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
  • Fees Collected: ${convertToNumber(feesBalance, QUOTE_PRECISION).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
  • Insurance Fund: ${convertToNumber(insuranceBalance, QUOTE_PRECISION).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;

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
    logger.info(`Tweeted (${status.length} characters): https://twitter.com/DriftFuturesBot/status/${response.id_str}`);
  } else {
    logger.info(`Tweeted (${status.length} characters):

${status}`);
  }
}
