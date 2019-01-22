/**
 * Created on 22.01.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');

describe('Call the `Application controller` specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN application with page controller is installed WHEN getting the URL that ending without slash THEN expected header should be loaded`,
        () => {
            return webDriverHelper.browser.url("http://127.0.0.1:8080/app/com.enonic.app.appControllerTest").then(() => {
                studioUtils.saveScreenshot("app_controller_test1");
                return webDriverHelper.browser.waitForVisible("//h1[text()='My controller test page']", appConstant.TIMEOUT_3);
            })
        });
    //verifies bug: `Application controller not called for URL ending in /`
    it(`GIVEN application with page controller is installed WHEN getting the URL that ending with slash THEN expected header should be loaded`,
        () => {
            return webDriverHelper.browser.url("http://127.0.0.1:8080/app/com.enonic.app.appControllerTest/").then(() => {
                studioUtils.saveScreenshot("app_controller_test2");
                return webDriverHelper.browser.waitForVisible("//h1[text()='My controller test page']", appConstant.TIMEOUT_3);
            })
        });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
