require('chai').should()
const nock = require('nock')
const mockery = require('mockery')

const MOCK_HOST = 'http://localhost:1234'
const LOGIN_REDIRECT_URL = '/loginRedirect'
const LOGIN_URL = '/sainsburyLogin'
const SEARCH_URL = '/sainsburySearch'
const testConfig = {
    SAINSBURY_LOGIN_URL: MOCK_HOST + LOGIN_URL,
    SAINSBURY_SEARCH_URL: MOCK_HOST + SEARCH_URL,
}

describe('beerbot', function() {

    describe('sainsbury search', function() {

        before(function() {
            mockery.enable()
            mockery.warnOnUnregistered(false)
            mockery.registerMock('./config', testConfig)
        })

        after(function() {
            mockery.disable()
        })

        it('should return 278 beer', function() {
            this.timeout(10000)
            
            nock(MOCK_HOST)
                .post(LOGIN_URL)
                .reply(302, 'logged in!', {
                    'location' : MOCK_HOST + LOGIN_REDIRECT_URL
                })
                .get(LOGIN_REDIRECT_URL)
                .reply(200)
                // First page
                .get(SEARCH_URL)
                .query({pageSize: 108, beginIndex: 0, orderBy: 'NAME_ASC'})
                .replyWithFile(200, __dirname + '/sainsbury_page_1.html', { 'Content-Type': 'text/html' })
                // Second page
                .get(SEARCH_URL)
                .query({ pageSize: 108, beginIndex: 108, orderBy: 'NAME_ASC' })
                .replyWithFile(200, __dirname + '/sainsbury_page_2.html', { 'Content-Type': 'text/html' })
                // Third page
                .get(SEARCH_URL)
                .query({ pageSize: 108, beginIndex: 216, orderBy: 'NAME_ASC' })
                .replyWithFile(200, __dirname + '/sainsbury_page_3.html', { 'Content-Type': 'text/html' })

            let sainsbury = require('../lib/sainsbury')
            return sainsbury.getBeers()
                .then(beers => beers.length.should.equals(278))
        })
    })
})