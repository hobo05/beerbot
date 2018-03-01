const chowdown = require('chowdown');
const rp = require('request-promise');
const cheerio = require('cheerio');
const Promise = require("bluebird");

let qs = {
    	pageSize: '108',
    	beginIndex: '0',
    	orderBy: 'NAME_ASC'
	}
let defaultOptions = {
    uri: 'https://www.sainsburys.co.uk/shop/CategoryDisplay?langId=44&storeId=10151&catalogId=10123&categoryId=340871&promotionId=&listId=&searchTerm=&hasPreviousOrder=&previousOrderId=&categoryFacetId1=&categoryFacetId2=&bundleId=&parent_category_rn=340854&top_category=340854',
    jar: true,
    transform: function (body) {
        return cheerio.load(body);
    }
}
// Since we're going to be cloning options later, we should do it for the first request too
defaultOptions.qs = Object.assign({}, qs)

rp(defaultOptions)
    .then($ => {
        // get the first pages section since it occurs in the header and the footer
        let pages = $('.pages').first()
        // Find all page numbers by looking into the span and filter out the numbers
        let pageNumbers = pages.find('span')
        	.map((i, elem) => $(elem).text())
        	.get()
        	.filter(elem => /\d+/.test(elem))

        // Use the max page number to iterate through the pages
        let maxPageNumber = Math.max(...pageNumbers)
		let pagePromises = [];
		for (let i = 0; i < maxPageNumber; i++) {
			// Update the beginIndex based on the page number
			let options = cloneOptions(qs.pageSize*i)
			let pagePromise = rp(options).then($ => scrapeBeerList($))
		    pagePromises.push(pagePromise);
		}
		return pagePromises
    })
    .reduce((finalPageArray, currentPageArray) => finalPageArray.concat(currentPageArray), [])
    .then(pageArray => console.log(`pageArray=${JSON.stringify(pageArray)}`))
    .catch(function (err) {
        // Crawling failed or Cheerio choked...
        console.error(err)
    });

function cloneOptions(beginIndex) {
	// Build the options by cloning it. 
	let optionsCopy = Object.assign({}, defaultOptions);
	optionsCopy.qs = Object.assign(qs, {beginIndex: beginIndex})
	return optionsCopy
}

function scrapeBeerList($) {
	let beerGrid = $('.productLister.gridView').first().html();
	return chowdown.body(beerGrid).collection('.product', {
		name: product => product.string('.productNameAndPromotions>h3>a').then(p => p.trim()),
		pricePerUnit: product => product.string('.pricePerUnit').then(p => p.trim()),
		pricePerMeasure: product => product.string('.pricePerMeasure').then(p => p.trim()),
		url: '.productNameAndPromotions>h3>a/href'
	})
}