/**
 * Created on 05.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const LongForm = require('../../page_objects/wizardpanel/long.form.panel');

describe('publish.site.with.invalid.child.spec tests for ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let LONG_2_4_NAME = appConst.generateRandomName('long');


    it(`Preconditions: test site and invalid child has been created`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteName = appConst.generateRandomName('site');
            //1. Add new site:
            SITE = contentBuilder.buildSite(siteName, 'test', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            //2. Add invalid long content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_2_4);
            await contentWizard.typeDisplayName(LONG_2_4_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN Publish dialog has been opened WHEN 'Include child' icon has been clicked THEN 'Publish' button gets disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select the site and open Publish dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            //2. Click on 'Include children' icon:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //3. Verify that 'Publish Now' button gets disabled:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    it("GIVEN existing site with invalid child WHEN the invalid content has been removed in the dialog THEN 'Publish' button gets enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select the site and open Publish dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            //2.  Click on 'Include children' icon:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //3. Click on remove icon and remove the invalid item:
            await contentPublishDialog.removeDependentItem(LONG_2_4_NAME);
            //4. Verify that 'Publish Now' button gets enabled:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
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
