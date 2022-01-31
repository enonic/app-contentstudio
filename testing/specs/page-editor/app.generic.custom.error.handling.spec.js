/**
 * Created on 05.02.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");

describe('Custom error handling - specification. Verify that application error page is loaded when error occurred', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_WITH_ERROR = 'Page with error';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP], CONTROLLER_WITH_ERROR);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site(controller has a error) is selected WHEN 'Preview' button has been pressed THEN expected error page should be loaded in new browser tab`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select existing site (controller with a error is selected)
            await studioUtils.findAndSelectItem(SITE.displayName);
            //2. Click on 'Preview' button and switch to new browser tab:
            await contentBrowsePanel.clickOnPreviewButton();
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            //3. Verify that expected error-page is loaded:
            let pageSource = await studioUtils.getPageSource();
            await studioUtils.saveScreenshot('custom_error_handling');
            assert.include(pageSource, 'Oops, something went wrong!', "Expected message should be in the error page!");
            assert.include(pageSource, 'System got an error 500', "Expected response code should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
