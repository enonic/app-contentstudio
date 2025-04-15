/**
 * Created on 22.01.2019.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const Page = require('../page_objects/page');
const appConst = require('../libs/app_const');

describe('Call the `Application controller` specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN application with page controller is installed WHEN getting the URL that ending without slash THEN expected header should be loaded`,
        async () => {
            let page = new Page();
            await studioUtils.getBrowser().url("http://127.0.0.1:8080/webapp/com.enonic.xp.ui_testing.contenttypes");
            await studioUtils.saveScreenshot("app_controller_test1");
            //Expected header should be loaded:
            await page.waitForElementDisplayed("//h1[text()='My controller test page']", appConst.mediumTimeout);
        });

   //verifies bug: `Application controller not called for URL ending in /`
    it(`GIVEN application with page controller is installed WHEN getting the URL that ending with slash THEN expected header should be loaded`,
        async () => {
            let page = new Page();
            await studioUtils.getBrowser().url("http://127.0.0.1:8080/webapp/com.enonic.xp.ui_testing.contenttypes/");
            await studioUtils.saveScreenshot("app_controller_test2");
            await page.waitForElementDisplayed("//h1[text()='My controller test page']", appConst.mediumTimeout);
        });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
