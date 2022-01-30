# drift-twitter-bot

## Functionality

- [x] Posts hourly funding rates (top three 'best' rates for long and short positions).
- [x] Posts Drift stats every six hours.
- [X] Posts 'gm' once a day at a random time.

## Twitter Integration

Note: the bot is currently configured to connect to the [@DriftFuturesBot](https://twitter.com/DriftFuturesBot) Twitter account using keys secured by DaemonWAGMI.

## Current Hosting

The bot currently runs on node (using [nvm](https://github.com/nvm-sh/nvm) via the [.nvmrc](https://github.com/DaemonWAGMI/drift-twitter-bot/blob/main/.nvmrc) to pin the version), deployed to Heroku (note the [Procfile](https://github.com/DaemonWAGMI/drift-twitter-bot/blob/main/Procfile)).

## ToDo

- [ ] Implement 'slot' logic to enable liquidation broadcasts to Twitter
- [ ] Unit tests
