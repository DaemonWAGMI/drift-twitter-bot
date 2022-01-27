import twit from 'twit';
import axios from 'axios';
import moment from 'moment';
import logger from './logger';

const twitterClient = new twit({
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

export async function getBase64(url: string): Promise<string> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data, 'binary').toString('base64');
}

export async function getLastStatsTweet() {
  const {
    data,
  } = await twitterClient.get('statuses/user_timeline', {
    count: 200,
    exclude_replies: true,
    screen_name: 'DriftFuturesBot',
    trim_user: true,
    tweet_mode: 'extended',
  });

  return data
    .sort(sortTweetsByCreatedDesc)
    .find(({ full_text }) => full_text.includes('The latest stats from the @DriftProtocol perpetual futures platform:'));
}

export function reportTwitterError(error) {
  const {
    message,
    statusCode,
  } = error;

  logger.error({ message, statusCode });
}

export function sortTweetsByCreatedDesc(a, b) {
  const aTimestamp = moment(a.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY').unix();
  const bTimestamp = moment(b.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY').unix();

  return bTimestamp - aTimestamp;
}

export async function tweet(params) {
  const {
    data,
  } = await twitterClient.post('statuses/update', params);

  return data;
}

export async function tweetWithImage(params, imageUrl) {
  const processedImage = await getBase64(imageUrl);

  const {
    data,
  } = await twitterClient.post('media/upload', {
    media_data: processedImage,
  });

  return await tweet(Object.assign({
    media_ids: [
      data.media_id_string,
    ],
  }, params));
}
