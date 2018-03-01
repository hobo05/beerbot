const sainsbury = require('./lib/sainsbury.js')

sainsbury.getBeers()
	.then(pageArray => console.log(`pageArray=${JSON.stringify(pageArray)}`))
	.catch(function (err) {
	    // Crawling failed or Cheerio choked...
	    console.error(err)
	});