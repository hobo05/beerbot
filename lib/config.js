const dotenv = require('dotenv')

dotenv.load()

if (!process.env.SLACK_TOKEN) {
    console.log('Error: Specify slack bot token in .env (e.g. SLACK_TOKEN=abc)')
    process.exit(1)
}

if (!process.env.USERNAME) {
    console.log('Error: Specify your sainsbury username in .env (e.g. USERNAME=test@example.com)')
    process.exit(1)
}

if (!process.env.PASSWORD) {
    console.log('Error: Specify your sainsbury password in .env (e.g. PASSWORD=Password1)')
    process.exit(1)
}


const config = {
    SLACK_TOKEN: process.env.SLACK_TOKEN,
    SAINSBURY_USERNAME: process.env.USERNAME,
    SAINSBURY_PASSWORD: process.env.PASSWORD,
    SAINSBURY_LOGIN_URL: 'https://www.sainsburys.co.uk/webapp/wcs/stores/servlet/Logon',
    SAINSBURY_SEARCH_URL: 'https://www.sainsburys.co.uk/shop/CategoryDisplay?langId=44&storeId=10151&catalogId=10123&categoryId=340871&promotionId=&listId=&searchTerm=&hasPreviousOrder=&previousOrderId=&categoryFacetId1=&categoryFacetId2=&bundleId=&parent_category_rn=340854&top_category=340854',
}

module.exports = config