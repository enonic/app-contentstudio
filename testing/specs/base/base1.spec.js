/**
 * Created on 24.06.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const Page = require('../../page_objects/page');


describe('Simple selenium test ', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN google site is opened THEN expected title should be loaded in the page`,
        async () => {
            let page = new Page();
            await webDriverHelper.browser.url("http://www.google.com/");
            studioUtils.saveScreenshot("base_test1");
            await page.waitForElementDisplayed("//input[@name='q']", appConstant.mediumTimeout);
            let title = await page.getTitle();
            assert.equal(title, "Google");
        });

   
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
