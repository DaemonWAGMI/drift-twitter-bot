import {
  BN,
  Provider,
} from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  Markets as MARKETS,
  QUOTE_PRECISION,
  ZERO,
	ClearingHouse,
  ClearingHouseAccountTypes,
  Wallet,
  Market,
  MarketsAccount,
  StateAccount,
  calculateInsuranceFundSize,
  calculateLongShortFundingRate,
  convertBaseAssetAmountToNumber,
  convertToNumber,
  estimateTps,
  getOracleClient,
	initialize,
} from '@drift-labs/sdk';
import logger from './logger';
import { connection as rpcConnection } from './solana';

export const HOURLY_FUNDING_TIMEFRAME: BN = new BN(1);
export const TWAP_PRECISION: BN = new BN(10 ** 10);
export const YEARLY_FUNDING_TIMEFRAME: BN = new BN(24 * 365.25);
export let ClearingHouseSubscription: ClearingHouse | undefined;
export let MarketsAccountData: MarketsAccount | undefined;
export let StateAccountData: StateAccount | undefined;
export let isDriftConnected: boolean;

export type ClearingHouseIdl = {
  errors: ClearingHouseIdlError[];
};

export type ClearingHouseIdlError = {
  code: number;
  message: string;
  name: string;
};

export type FundingRate = {
  baseAssetSymbol: string;
  funding: {
    hourly: {
      longFundingRate: BN;
      shortFundingRate: BN;
    };
    yearly: {
      longFundingRate: BN;
      shortFundingRate: BN;
    };
  };
};

export async function connect(wallet: Wallet, optionalSubscriptions: ClearingHouseAccountTypes[]): Promise<boolean> {
	const anchorProvider = new Provider(
    rpcConnection,
    wallet,
    Provider.defaultOptions()
  );

  const initializeClearingHouse = initialize({
    env: process.env.DRIFT_ENV,
  });

  try {
    ClearingHouseSubscription = ClearingHouse.from(
  		rpcConnection,
  		anchorProvider.wallet,
      new PublicKey(initializeClearingHouse.CLEARING_HOUSE_PROGRAM_ID)
  	);
  } catch (error: any) {
    logger.error(error, { stack: new Error().stack });
    isDriftConnected = false;
    return false;
  }

  ClearingHouseSubscription.eventEmitter.on('marketsAccountUpdate', onMarketsAccountUpdate);
  ClearingHouseSubscription.eventEmitter.on('stateAccountUpdate', onStateAccountUpdate);

  let clearingHouseSubscription;
  try {
    clearingHouseSubscription = await ClearingHouseSubscription.subscribe([
      'liquidationHistoryAccount',
      'tradeHistoryAccount',
    ]);
  } catch (error: any) {
    logger.error(error, { stack: new Error().stack });
    isDriftConnected = false;
    return false;
  }

  if (!clearingHouseSubscription) {
    logger.error('No ClearingHouse subscription established');
    isDriftConnected = false;
    return false;
  }

  isDriftConnected = true;
  return true;
}

export function destroy() {
  if (ClearingHouseSubscription && ClearingHouseSubscription.isSubscribed) {
    ClearingHouseSubscription.eventEmitter.off('marketsAccountUpdate', onMarketsAccountUpdate);
    ClearingHouseSubscription.eventEmitter.off('stateAccountUpdate', onStateAccountUpdate);
    ClearingHouseSubscription.unsubscribe();
  }
}

export function getErrorFromHexCode(hexCode: string, idl: ClearingHouseIdl): ClearingHouseIdlError | undefined {
  const {
    errors,
  } = idl;

  return errors.find(({ code }) => {
    const errorCode = parseInt(hexCode, 16);
    return errorCode === code;
  });
}

export async function getFundingRates(marketsData: MarketsAccount): Promise<FundingRate[]> {
  return await Promise.all(MARKETS.map(async ({ baseAssetSymbol, marketIndex, oracleSource }) => {
    const oracleClient = getOracleClient(oracleSource, rpcConnection, 'mainnet-beta');
    const marketData: Market = marketsData.markets[marketIndex.toNumber()];

    let hourlyLongFundingRate, hourlyShortFundingRate, yearlyLongFundingRate, yearlyShortFundingRate;
    try {
      const oraclePriceData = await oracleClient.getOraclePriceData(marketData.amm.oracle);
      const hourlyFundingRates = await calculateLongShortFundingRate(marketData, oraclePriceData, HOURLY_FUNDING_TIMEFRAME);
      const yearlyFundingRates = await calculateLongShortFundingRate(marketData, oraclePriceData, YEARLY_FUNDING_TIMEFRAME);
      hourlyLongFundingRate = hourlyFundingRates[0];
      hourlyShortFundingRate = hourlyFundingRates[1];
      yearlyLongFundingRate = yearlyFundingRates[0];
      yearlyShortFundingRate = yearlyFundingRates[1];
    } catch (error: any) {
      throw new Error(error);
    }

    return {
      baseAssetSymbol,
      funding: {
        hourly: {
          longFundingRate: hourlyLongFundingRate,
          shortFundingRate: hourlyShortFundingRate,
        },
        yearly: {
          longFundingRate: yearlyLongFundingRate,
          shortFundingRate: yearlyShortFundingRate,
        },
      },
    };
  }));
}

export function isExchangePaused(): boolean {
  if (!StateAccountData) {
    return false;
  }
  return StateAccountData.exchangePaused;
}

function onMarketsAccountUpdate(marketsAccountUpdate: MarketsAccount): void {
  logger.debug('Market account updated');
  MarketsAccountData = marketsAccountUpdate;
}

function onStateAccountUpdate(stateAccountUpdate: StateAccount): void {
  logger.debug('State account updated');
  StateAccountData = stateAccountUpdate;
}
