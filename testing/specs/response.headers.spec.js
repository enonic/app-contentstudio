/**
 * Created on 30.12.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');

describe('response.headers.spec - Send a request and verify headers in response', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN navigated to Content Studio WHEN GET request has been sent THEN expected headers should be present in the response`,
        async () => {
            let reqHeaders = await studioUtils.sendRequestGetHeaders();
            let headers = reqHeaders.toLowerCase();

            assert.isTrue(headers.includes('X-Frame-Options: SAMEORIGIN'.toLowerCase()),
                "'X-Frame-Options: SAMEORIGIN' header should be present in the response");
            assert.isTrue(headers.includes('X-Content-Type-Options: nosniff'.toLowerCase()),
                "'X-Content-Type-Options: nosniff' header should be present in the response")
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
