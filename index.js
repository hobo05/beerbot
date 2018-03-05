require('dotenv').config();

if (!process.env.SLACK_TOKEN) {
    console.log('Error: Specify slack bot token in .env (e.g. SLACK_TOKEN=abc)');
    process.exit(1);
}

if (!process.env.USERNAME) {
    console.log('Error: Specify your sainsbury username in .env (e.g. USERNAME=test@example.com)');
    process.exit(1);
}

if (!process.env.PASSWORD) {
    console.log('Error: Specify your sainsbury password in .env (e.g. PASSWORD=Password1)');
    process.exit(1);
}

// requires
const sainsbury = require('./lib/sainsbury.js')
const Fuse = require('fuse.js');
const Botkit = require('botkit');
const Promise = require("bluebird");
const _ = require('lodash');

// Fuse options
const DEFAULT_FUSE_OPTIONS = {
    include: ["score"],
    shouldSort: true,
    threshold: 0.3,
}
const SEARCH_NAME_OPTIONS = Object.assign({
	keys: ["name"]
}, DEFAULT_FUSE_OPTIONS)


const controller = Botkit.slackbot({
	require_delivery: true,
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM();

// Promisify bot methods
Promise.promisifyAll(bot);

function randResponse(responses) {
    return responses[_.random(responses.length-1)];
}

function fatalError(message, error, customMessage) {
    console.error("*******Fatal Error******* " + customMessage + "\n", error);
    bot.reply(message, ":face_with_head_bandage: *My brain exploded:* _" + customMessage + "_");
}

function searchBeer(searchTerm) {
	return sainsbury.getBeers()
		.then(allBeers => {
			let fuse = new Fuse(allBeers, SEARCH_NAME_OPTIONS);
	        return fuse.search(searchTerm);	
	    })
}

function formatBeerResults(beers) {
	let attachments = []
	beers.forEach(beer => {
		attachments.push({
            "fallback": beer.name,
            "title": beer.name,
            "title_link": beer.url,
            "thumb_url": beer.imageUrl,
            "fields": [
                {
                    "title": "Price/Unit",
                    "value": beer.pricePerUnit,
                    "short": true
                },
                {
                    "title": "Price/Measure",
                    "value": beer.pricePerMeasure,
                    "short": true
                }
            ],
        })
	})
	return attachments
}

controller.hears('(?:search|find) all beer',['direct_message', 'direct_mention'], function(bot, message) {
    bot.reply(message, 'querying the intergalactic smart beer fridge *beep* *boop* *beep* *boop*...')
    sainsbury.getBeers()
    	.then(beers => {
    		let beerList = ""
    		beers.forEach(beer => beerList += `• ${beer.name}\n`)
    		bot.reply(message, `Here is the full list of beers:\n${beerList}Use the *search [beer name]* command to get the link to the beer(s)`)
    	})
    	.catch(e => fatalError(message, e, "Something weird happened when I tried searching..."));
});

controller.hears('(?:search|find) (.+)',['direct_message', 'direct_mention'], function(bot, message) {
    let searchTerm = message.match[1];
    bot.reply(message, 'querying the intergalactic smart beer fridge *beep* *boop* *beep* *boop*...')
    searchBeer(searchTerm)
    	.then(beers => {
    		console.log(`searchTerm=${searchTerm}, beers=${JSON.stringify(beers)}`)
    		return beers
    	})
    	.then(beers => beers.slice(0, Math.min(beers.length, 20)))
    	.then(beers => formatBeerResults(beers))
    	.then(beerAttachments => {
    		if (beerAttachments.length > 0) {
	    		bot.reply(message, {
		    		text: `Here are the top 20 results from Sainsbury!`,
		    		attachments: beerAttachments
	    		})
    		} else {
	    		bot.reply(message, 'Sorry little fella, I got a goose egg :egg: :man-shrugging:')
    		}
    	})
    	.catch(e => fatalError(message, e, "Something weird happened when I tried searching..."));
});

controller.hears('^help$','direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, 'You can use the following commands' + [
        '• search|find all beer',
        '• search|find [beer name]'
        ].join('\n '));
});

controller.hears('\\?$','direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, randResponse([
        'I don\'t like the tone of your question so I\'m not going to answer it',
        'You dropped out for a second and I didn\'t catch that, can you repeat it?',
        'You know, I asked my maker that the other day and he shut me down.',
        ':sleeping::sleeping::sleeping:'
    ]));
});

controller.hears('.+','direct_message,direct_mention,mention', function(bot, message) {
    bot.reply(message, "I'll get back to you tomorrow");
});