import moment from 'moment';
import onExit from 'signal-exit';
import emoji from 'node-emoji';
import {
  QUOTE_PRECISION,
  LiquidationHistoryAccount,
  LiquidationRecord,
  convertToNumber,
} from '@drift-labs/sdk';
import { ClearingHouseSubscription } from '../services/drift';
import logger from '../services/logger';
import {
  delay,
  sliceSlottedArray,
} from '../services/utilities';

async function onEventLiquidations({ head, liquidationRecords }: LiquidationHistoryAccount): Promise<void> {
  /*
  if (isUpdatingLiquidations) {
    return;
  }
  isUpdatingLiquidations = true;

  const newLiquidationRecordHead = head.toNumber();
  if (liquidationRecordHead === null) {
    liquidationRecordHead = newLiquidationRecordHead - 1;
  }

  const newLiquidationRecords: LiquidationRecord[] = sliceSlottedArray(liquidationRecordHead, newLiquidationRecordHead, liquidationRecords);
  logger.info(`${newLiquidationRecords.length} new liquidations reported; Curhead: ${newLiquidationRecordHead}; Prevhead ${liquidationRecordHead}`);

  for (const liquidationRecord of newLiquidationRecords) {
    const {
      baseAssetValueClosed,
      feeToInsuranceFund,
      feeToLiquidator,
      partial,
      ts,
      userAuthority,
    } = liquidationRecord;
    const amountClosedUsd = convertToNumber(baseAssetValueClosed, QUOTE_PRECISION);
    const messageTitleContent = `${partial ? 'Partial' : 'Full'} Liquidation ${emoji.get('skull_and_crossbones')}`;
    const messageDescriptionContent = `A [user](https://app.drift.trade/?authority=${userAuthority}) was just ${partial ? 'partially' : 'fully'} liquidated:

• Amount: ${Math.max(amountClosedUsd, 0.01).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
\u2003• Fee to Insurance Fund: ~${Math.max(convertToNumber(feeToInsuranceFund, QUOTE_PRECISION), 0.01).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} ${emoji.get('writing_hand')}
\u2003• Fee to Liquidator: ~${Math.max(convertToNumber(feeToLiquidator, QUOTE_PRECISION), 0.01).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} ${emoji.get('smiling_imp')}
• Timestamp: ${moment.unix(ts.toNumber()).toISOString()}`;
    const messageEmbed = new MessageEmbed()
      .setTitle(messageTitleContent)
      .setDescription(messageDescriptionContent);
    const message = {
      embeds: [
        decorateEmbed(messageEmbed),
      ],
    };

    try {
      await sendDiscord(message, process.env.DISCORD_GUILD, process.env.DISCORD_CHANNEL_LIQUIDATIONS);
    } catch (error: any) {
      logger.error(error, { stack: new Error().stack });
    }
    logger.info(`Messaged Discord:
----
${messageTitleContent}
${messageDescriptionContent}`);

    delay(5000);
  }

  liquidationRecordHead = newLiquidationRecordHead;
  isUpdatingLiquidations = false;
  */
}

let isUpdatingLiquidations = false;
let liquidationRecordHead: number;

export default (): void => {
  if (ClearingHouseSubscription) {
    ClearingHouseSubscription.eventEmitter.on('liquidationHistoryAccountUpdate', onEventLiquidations);
  }

  onExit((code: number | null, signal: string | null) => {
    if (ClearingHouseSubscription) {
      ClearingHouseSubscription.eventEmitter.off('liquidationHistoryAccountUpdate', onEventLiquidations);
    }
  });
};
