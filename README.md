# drift-twitter-bot

## Functionality

- [x] Posts hourly funding rates (top three 'best' rates for long and short positions).
- [x] Posts Drift stats every six hours.
- [X] Posts 'gm' once a day at a random time.

## Twitter Integration

Note: the bot is currently configured to connect to the [@DriftFuturesBot](https://twitter.com/DriftFuturesBot) Twitter account using keys secured by DaemonWAGMI.

## Development

### Dependencies

  * node
  * yarn

### Environment Variables

The project uses [dotenv](https://github.com/motdotla/dotenv) to provide environment variables that is either too sensitive to track in source-control (such as `WALLET_PRIVATE_KEY`), or environment-specific (such as the tweet schedule `TWEET_GM_SCHEDULE`).

For local development, place the relevant environment variable dotenv file at the project root as `.env.{env}`. This file is then specified via the `yarn run start-{env}` commands; see package.json for the out-of-the-box support for `dev` and `prod`. Note that the `.gitignore` automatically [ignores](https://github.com/DaemonWAGMI/drift-twitter-bot/blob/main/.gitignore) any `.env*` file to save yourself from committing the file by accident.

### Current Hosting

The bot currently runs on node (using [nvm](https://github.com/nvm-sh/nvm) via the [.nvmrc](https://github.com/DaemonWAGMI/drift-twitter-bot/blob/main/.nvmrc) to pin the version), deployed to Heroku (note the [Procfile](https://github.com/DaemonWAGMI/drift-twitter-bot/blob/main/Procfile)).

### ToDo

- [ ] Implement 'slot' logic to enable liquidation broadcasts to Twitter
- [ ] Unit tests
