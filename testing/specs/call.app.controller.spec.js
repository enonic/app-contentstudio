/**
 * Created on 22.01.2019.
 */
const chai = require('chai');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const Page = require('../page_objects/page');

describe('Call the `Application controller` specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);

    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN application with page controller is installed WHEN getting the URL that ending without slash THEN expected header should be loaded`,
        async () => {
            let page = new Page();
            await studioUtils.getBrowser().url("http://127.0.0.1:8080/webapp/com.enonic.app.appControllerTest");
            await studioUtils.saveScreenshot("app_controller_test1");
            //Expected header should be loaded:
            await page.waitForElementDisplayed("//h1[text()='My controller test page']", appConstant.mediumTimeout);
        });

   //verifies bug: `Application controller not called for URL ending in /`
    it(`GIVEN application with page controller is installed WHEN getting the URL that ending with slash THEN expected header should be loaded`,
        async () => {
            let page = new Page();
            await studioUtils.getBrowser().url("http://127.0.0.1:8080/webapp/com.enonic.app.appControllerTest/");
            await studioUtils.saveScreenshot("app_controller_test2");
            await page.waitForElementDisplayed("//h1[text()='My controller test page']", appConstant.mediumTimeout);
        });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
