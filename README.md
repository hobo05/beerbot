# beerbot

## Commands

* search|find all beer
* search|find [beer name]

## Tech Stack

* [Botkit](https://howdy.ai/botkit/) - Toolkit for creating bots
* [Blue Bird](http://bluebirdjs.com/) - Feature-rich Promise library
* [Fuse.js](http://fusejs.io/) - Lightweight fuzzy-search library

## How to Run

### Local Setup

1. Sign up for <http://www.slack.com> and create a team if you don't have admin rights in your current one
2. Create a bot integration and note down the API key
3. Make a copy of `.env-example` in the root folder and name it `.env`
4. Add the necessary environment variables to the file. See here for more details  <https://www.npmjs.com/package/dotenv>
5. Run `npm start`
6. Chat with your bot!

### Heroku Setup

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

1. After performing the local setup and seeing that everything works, sign up for Heroku on the free plan with the button above
2. Follow the tutorial for [Getting Started on Heroku with Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs) if you don't know how Heroku works
3. Create a new Heroku app from your project root
4. Install <https://github.com/xavdid/heroku-config> and push your .env settings to heroku
5. Run `heroku scale web=0 worker=1` to make sure the chatbot isn't required to bind to the provided Heroku port, otherwise Heroku will shut the app down thinking the app is not responsive since it didn't bind to the port.
6. Push your app to the Heroku repo and tail the logs
7. Chat with your cloud-enabled bot!
