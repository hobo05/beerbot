const config = require('./config')
const chowdown = require('chowdown')
const rp = require('request-promise').defaults({jar: true})
const cheerio = require('cheerio')


const defaultQueryString = {
    pageSize: '108',
    beginIndex: '0',
    orderBy: 'NAME_ASC'
}
const defaultSearchOptions = {
    uri: config.SAINSBURY_SEARCH_URL,
    transform: function (body) {
        return cheerio.load(body)
    }
}

const loginOptions = {
    uri: config.SAINSBURY_LOGIN_URL,
    simple: false,
    resolveWithFullResponse: true,
    form: {
        callToPostSSOLogon: 'true',
        currentViewName: 'PostCodeCheckBeforeAddToTrolleyView',
        isDeliveryPoscodeValid: 'false',
        logonCallerId: 'LogonButton',
        logonId: config.SAINSBURY_USERNAME,
        logonPassword: config.SAINSBURY_PASSWORD,
        messageAreaId: 'rhsLogonMessageArea',
        reLogonURL: 'https://www.sainsburys.co.uk/shop/LogonView?logonCallerId=LogonButton&isDeliveryPoscodeValid=false&storeId=10151&messageAreaId=rhsLogonMessageArea',
        remember_me: 'true',
        storeId: '10151',
        URL: 'https://www.sainsburys.co.uk/shop/MyAccount?langId=44&storeId=10151',
    }

}

// Since we're going to be cloning options later, we should do it for the first request too
defaultSearchOptions.qs = Object.assign({}, defaultQueryString)

function cloneOptions(beginIndex) {
    // Build the options by cloning it. 
    let optionsCopy = Object.assign({}, defaultSearchOptions)
    optionsCopy.qs = Object.assign(defaultQueryString, {beginIndex: beginIndex})
    return optionsCopy
}

/* 
 * The result of the login is a redirect which request-promise doesn't
 * handle natively, so we need to follow the redirect
 */
function followLoginRedirect(response) {
    if (response.statusCode !== 302) { // Status Codes other than 302
        let err = {
            message: `The statuscode for the Sainsbury login needs to be 302, but was ${response.statusCode}`,
            statusCode: response.statusCode,
            error: response.body,
            options: loginOptions,
            response: response
        }
        throw err
    }
    // Follow the redirect which completes the login
    return rp.get(response.headers.location)
}

function scrapeBeerList($) {
    let beerGrid = $('.productLister.gridView').first().html()
    const newLocal = chowdown.body(beerGrid).collection('.product', {
        name: product => product.string('.productNameAndPromotions>h3>a').then(p => p.trim()),
        pricePerUnit: product => product.string('.pricePerUnit').then(p => p.trim()),
        pricePerMeasure: product => product.string('.pricePerMeasure').then(p => p.trim()),
        url: '.productNameAndPromotions>h3>a/href',
        imageUrl: product => product.string('.productNameAndPromotions>h3>a>img/src')
            .then(url => `https:${url}`)
    })
    return newLocal
}

function scrapeBeerPages($) {
    // get the first pages section since it occurs in the header and the footer
    let pages = $('.pages').first()
    // Find all page numbers by looking into the span and filter out the numbers
    let pageNumbers = pages.find('span')
        .map((i, elem) => $(elem).text())
        .get()
        .filter(elem => /\d+/.test(elem))

    // Use the max page number to iterate through the pages
    let maxPageNumber = Math.max(...pageNumbers)
    let pagePromises = []

    // Add the first page's beers
    pagePromises.push(scrapeBeerList($))

    // Skip the first page when looping
    for (let i = 1; i < maxPageNumber; i++) {
    // Update the beginIndex based on the page number
        let options = cloneOptions(defaultQueryString.pageSize*i)
        let pagePromise = rp(options).then($ => scrapeBeerList($))
        pagePromises.push(pagePromise)
    }
    return pagePromises
}

let getBeers = () => rp.post(loginOptions)
    .then(response => followLoginRedirect(response))
    .then(() => rp(defaultSearchOptions))
    .then($ => scrapeBeerPages($))
    .reduce((finalPageArray, currentPageArray) => finalPageArray.concat(currentPageArray), [])

module.exports.getBeers = getBeers