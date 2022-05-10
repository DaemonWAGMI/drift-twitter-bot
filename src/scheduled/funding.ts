import emoji from 'node-emoji';
import {
  Markets as MARKETS,
  ZERO,
  convertToNumber,
} from '@drift-labs/sdk';
import { PublicKey } from '@solana/web3.js';
import {
  TWAP_PRECISION,
  ClearingHouseSubscription,
  FundingRate,
  MarketsAccountData,
  getFundingRates,
  isDriftConnected,
} from '../services/drift';
import { isDevEnv } from '../services/environment';
import logger from '../services/logger';
import {
  reportTwitterError,
  tweet,
} from '../services/twitter';
import { delay } from '../services/utilities';

export async function funding() {
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

  let marketsFundingData;
  try {
    marketsFundingData = await getFundingRates(MarketsAccountData);
  } catch (error: any) {
    logger.error(error, { stack: new Error().stack });
    return;
  }

  const longMarketsData = marketsFundingData
    .filter(({ funding: { yearly: { longFundingRate } } }) => longFundingRate.lt(ZERO))
    .sort(({ funding: { yearly: { longFundingRate: aFundingRate } } }, { funding: { yearly: { longFundingRate: bFundingRate } } }) => aFundingRate.sub(bFundingRate).toNumber())
    .slice(0, 3);

  if (longMarketsData.length > 0) {
    const imbalancedMarkets = [];
    let longStatus = `Top long @DriftProtocol funding rates:
`;
    for (const market of longMarketsData) {
      const {
        baseAssetSymbol,
        funding: {
          yearly: {
            longFundingRate: yearlyLongFundingRate,
            shortFundingRate: yearlyShortFundingRate,
          },
        },
      } = market;
      const convertedYearlyLongFundingRate = convertToNumber(yearlyLongFundingRate, TWAP_PRECISION);
      const formattedYearlyLongFundingRate = convertedYearlyLongFundingRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedYearlyShortFundingRate = convertToNumber(yearlyShortFundingRate, TWAP_PRECISION).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const isImbalanced = !yearlyLongFundingRate.eq(yearlyShortFundingRate);

      if (isImbalanced) {
        longStatus += `
  $${baseAssetSymbol}*: ${formattedYearlyShortFundingRate}% / ${formattedYearlyLongFundingRate}% APR${Math.abs(convertedYearlyLongFundingRate) > 100 ? ` ${emoji.get('eyes')}` : ''}
`;
        imbalancedMarkets.push(`${baseAssetSymbol}`);
      } else {
        longStatus += `
  $${baseAssetSymbol}: ${formattedYearlyLongFundingRate}% APR${Math.abs(convertedYearlyLongFundingRate) > 100 ? ` ${emoji.get('eyes')}` : ''}
`;
      }
    }
    longStatus += `${imbalancedMarkets.length > 0 ? `

\u2003* Denotes that [funding is capped](https://docs.drift.trade/funding-rates#uj-capped-symmetric-funding) due to a long-short imbalance` : ''}

Trade $${longMarketsData[0].baseAssetSymbol} here ${emoji.get('point_down')}

https://app.drift.trade/${longMarketsData[0].baseAssetSymbol}`;

    if (!isDevEnv()) {
      let response;
      try {
        response = await tweet({
          status: longStatus,
        });
      } catch (error) {
        reportTwitterError(error);
        return;
      }
      logger.debug(`Tweeted (${longStatus.length} characters): https://twitter.com/DriftFuturesBot/status/${response.id_str}`);
    } else {
      logger.debug(`Tweeted (${longStatus.length} characters):

    ${longStatus}`);
    }
    await delay(1000);
  }

  const shortMarketsData = marketsFundingData
    .filter(({ funding: { yearly: { longFundingRate } } }) => longFundingRate.gt(ZERO))
    .sort(({ funding: { yearly: { longFundingRate: aFundingRate } } }, { funding: { yearly: { longFundingRate: bFundingRate } } }) => bFundingRate.sub(aFundingRate).toNumber())
    .slice(0, 3);

  if (shortMarketsData.length > 0) {
    const imbalancedMarkets = [];
    let shortStatus = `Top short @DriftProtocol funding rates:
`;
    for (const market of shortMarketsData) {
      const {
        baseAssetSymbol,
        funding: {
          yearly: {
            longFundingRate: yearlyLongFundingRate,
            shortFundingRate: yearlyShortFundingRate,
          },
        },
      } = market;
      const convertedYearlyLongFundingRate = convertToNumber(yearlyLongFundingRate, TWAP_PRECISION);
      const formattedYearlyLongFundingRate = convertedYearlyLongFundingRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedYearlyShortFundingRate = convertToNumber(yearlyShortFundingRate, TWAP_PRECISION).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const isImbalanced = !yearlyLongFundingRate.eq(yearlyShortFundingRate);

      if (isImbalanced) {
        shortStatus += `
  $${baseAssetSymbol}*: ${formattedYearlyShortFundingRate}% / ${formattedYearlyLongFundingRate}% APR${Math.abs(convertedYearlyLongFundingRate) > 100 ? ` ${emoji.get('eyes')}` : ''}
`;
        imbalancedMarkets.push(`${baseAssetSymbol}`);
      } else {
        shortStatus += `
  $${baseAssetSymbol}: ${formattedYearlyLongFundingRate}% APR${Math.abs(convertedYearlyLongFundingRate) > 100 ? ` ${emoji.get('eyes')}` : ''}
`;
      }
    }
    shortStatus += `${imbalancedMarkets.length > 0 ? `

  * Funding is capped due to a long-short imbalance` : ''}

Trade $${shortMarketsData[0].baseAssetSymbol} here ${emoji.get('point_down')}

https://app.drift.trade/${shortMarketsData[0].baseAssetSymbol}`;

    if (!isDevEnv()) {
      let response;
      try {
        response = await tweet({
          status: shortStatus,
        });
      } catch (error) {
        reportTwitterError(error);
        return;
      }
      logger.debug(`Tweeted (${shortStatus.length} characters): https://twitter.com/DriftFuturesBot/status/${response.id_str}`);
    } else {
      logger.debug(`Tweeted (${shortStatus.length} characters):

    ${shortStatus}`);
    }
  }
}
