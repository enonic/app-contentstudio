/**
 * Created on 02.04.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const appConst = require('../libs/app_const');

describe('site.wizard.select.controller.spec: Saves site-data and selects a controller', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN wizard for new site is opened WHEN name typed and application have been selected (the site is saved automatically ) THEN controller selector should appear in no longer than 5 seconds`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            let SITE = contentBuilder.buildSite(displayName, 'test site', [appConst.APP_CONTENT_TYPES]);
            //1. Open new site-wizard:
            await studioUtils.doOpenSiteWizard();
            //2. Type the name and select an application with controllers(site will be saved automatically)
            await contentWizard.typeData(SITE);
            //3. Verify that the site is saved automatically after selecting an application with controllers
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            //3. Click on remove-icon and close the current notification message:
            await contentWizard.removeNotificationMessage();
            //4. switch to 'LiveEdit' and select the controller
            await contentWizard.selectPageDescriptor('Page');
            //The notification message should appear, because the site automatically saved after the selecting a page-controller.
            await studioUtils.saveScreenshot("site_page_descriptor_selected1");
            let result = await contentWizard.waitForNotificationMessage();
            assert.equal(result, appConst.itemSavedNotificationMessage(displayName), "Expected notification message should appear");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
