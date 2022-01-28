import twit, {
  Params,
} from 'twit';
import axios from 'axios';
import moment from 'moment';
import logger from './logger';

const twitterClient = new twit({
  access_token: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

export interface IResponse {
  created_at: string;
  full_text: string;
  id_str: string;
  media_id_string: string;
};

export interface IPromiseGetResponse {
  data: IResponse[];
}

export interface IPromisePostResponse {
  data: IResponse;
}

export async function getBase64(url: string): Promise<string> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data, 'binary').toString('base64');
}

export async function getLastStatsTweet(): Promise<IResponse | undefined> {
  const {
    data,
  } = <IPromiseGetResponse> await twitterClient.get('statuses/user_timeline', {
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

export function reportTwitterError(error: any): void {
  const {
    message,
    statusCode,
  } = error;

  logger.error({ message, statusCode });
}

export function sortTweetsByCreatedDesc(a: IResponse, b: IResponse): number {
  const aTimestamp = moment(a.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY').unix();
  const bTimestamp = moment(b.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY').unix();

  return bTimestamp - aTimestamp;
}

export async function tweet(params: Params): Promise<IResponse> {
  const {
    data,
  } = <IPromisePostResponse> await twitterClient.post('statuses/update', params);

  return data;
}

export async function tweetWithImage(params: Params, imageUrl: string): Promise<IResponse> {
  const processedImage = await getBase64(imageUrl);

  const {
    data,
  } = <IPromisePostResponse> await twitterClient.post('media/upload', {
    media_data: processedImage,
  });

  return await tweet(Object.assign({
    media_ids: [
      data.media_id_string,
    ],
  }, params));
}
