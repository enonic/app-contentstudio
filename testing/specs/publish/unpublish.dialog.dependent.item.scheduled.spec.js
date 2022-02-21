/**
 * Created on 18.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');

describe('Tests for dependent items in Unpublish dialog (for scheduled content)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const DATE_TIME_IN_FUTURE = "2029-09-10 00:00";
    let SITE;

    it(`WHEN existing site(include child items) has been scheduled THEN PUBLISHING SCHEDULED status should be displayed in the grid`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site-test');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnAddScheduleIcon();
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_FUTURE);
            await studioUtils.saveScreenshot("scheduled_site_publish_dialog");
            //5. Press the 'Schedule' button in the dialog:
            await contentPublishDialog.clickOnScheduleButton();
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, "2 items are published.", "Expected notification message should appear");
            await contentPublishDialog.waitForDialogClosed();
            //6. Verify that status is 'Publishing Scheduled' in Grid:
            let actualStatus = await contentBrowsePanel.getContentStatus(SITE.displayName);
            assert.equal(actualStatus, appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED, "Scheduled status should be displayed in the grid");
        });

    //Verify issue: Unpublish Item dialog - dependent items are not displayed when content with children are scheduled #4185
    //https://github.com/enonic/app-contentstudio/issues/4185
    it(`GIVEN existing scheduled site is selected WHEN Unpublish menu item has been clicked THEN 'Show dependent items' link should be displayed in the modal dialog`,
        async () => {
            let contentUnpublishDialog = new ContentUnpublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            //2. Click on Unpublish default action in the toolbar:
            await contentBrowsePanel.clickOnUnpublishButton();
            await studioUtils.saveScreenshot("scheduled_site_unpublish_dialog");
            //3. Verify that 'Show dependent items' link is displayed in the modal dialog:
            await contentUnpublishDialog.waitForShowDependentItemsLinkDisplayed();
            let actualStatus = await contentUnpublishDialog.getItemStatus(SITE.displayName);
            //4. Verify that 'Publishing Scheduled' status is displayed in the modal dialog:
            assert.equal(actualStatus, appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED, "Scheduled status should be displayed in the dialog");
            let actualNumber = await contentUnpublishDialog.getNumberInUnpublishButton();
            assert.equal(actualNumber, 2, "2 items will be unpablished");
        });
    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
