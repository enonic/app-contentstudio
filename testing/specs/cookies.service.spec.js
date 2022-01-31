/**
 * Created on 26.01.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');

describe("cookies.service.spec:  tests for cookies service", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const COOKIES_SERVICE = "cookies";
    const COOKIE_NAME = "JSESSIONID";
    const APP_NAME = "com.enonic.xp.ui_testing.contenttypes";

    it("GIVEN su is logged in WHEN request has been sent to service THEN expected cookie should be present in the response",
        async () => {
            await studioUtils.loadServiceURL(COOKIES_SERVICE, APP_NAME);
            let cookie = await webDriverHelper.browser.getCookies(COOKIE_NAME);
            assert.equal(cookie[0].name, COOKIE_NAME);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
