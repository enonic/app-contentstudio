/**
 * Created on 18.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('Tests for dependent items in Unpublish dialog (for scheduled content)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const DATE_TIME_IN_FUTURE = '2029-09-10 00:00';
    let SITE;

    // TODO epic-enonic-ui new tests: verify scheduled status in versions widget
    it(`WHEN existing site(include child items) has been scheduled THEN PUBLISHING SCHEDULED status should be displayed in the grid`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site-test');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            // 1. Select the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 2. Open Publish Tree dialog
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on Add Schedule:
            await contentPublishDialog.clickOnAddScheduleIcon();
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_FUTURE);
            await studioUtils.saveScreenshot('scheduled_site_publish_dialog');
            // 4. Press the 'Schedule' button in the dialog:
            await contentPublishDialog.clickOnScheduleButton();
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.equal(actualMessage, appConst.NOTIFICATION_MESSAGES.TWO_ITEMS_PUBLISHED, '2 items have been published. -  notification message should appear');
            await contentPublishDialog.waitForDialogClosed();
            // 5. Verify that status is 'Publishing Scheduled' in Grid:
            let actualStatus = await contentBrowsePanel.getContentStatus(SITE.displayName);
            assert.equal(actualStatus, appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED, "Scheduled status should be displayed in the grid");
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 6. 'Scheduled' status should be displayed in the 'Preview Item toolbar':
            //let status = await contentItemPreviewPanel.getContentStatus();
            //assert.equal(status, appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED,
             //   "'Scheduled' status should be displayed in the Preview Item toolbar");
            // 7. 'Show Changes' button should be displayed in the 'Preview Item' toolbar:
           // await contentItemPreviewPanel.waitForShowChangesButtonNotDisplayed();
        });

    // Verify issue: Unpublish Item dialog - dependent items are not displayed when content with children are scheduled #4185
    // https://github.com/enonic/app-contentstudio/issues/4185
    it(`GIVEN existing scheduled site is selected WHEN Unpublish menu item has been clicked THEN 'Show dependent items' link should be displayed in the modal dialog`,
        async () => {
            let contentUnpublishDialog = new ContentUnpublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 2. Click on Unpublish default action in the toolbar:
            await contentBrowsePanel.clickOnUnpublishButton();
            await studioUtils.saveScreenshot('scheduled_site_unpublish_dialog');
            // 3. Verify that 'Dependencies block' is displayed in the modal dialog
            await contentUnpublishDialog.waitForDependantsBlockDisplayed();
            let actualStatus = await contentUnpublishDialog.getItemStatus(SITE.displayName);
            // 4. Verify the number of dependent items
            let dependantItems = await contentUnpublishDialog.getDependentItemsPath();
            assert.ok(dependantItems.length === 1, 'One dependent item should be displayed in the dialog');
            // 5. Verify that 'Publishing Scheduled' status is displayed in the modal dialog:
            assert.equal(actualStatus, appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED, 'Scheduled status should be displayed in the dialog');
            let actualNumber = await contentUnpublishDialog.getNumberInUnpublishButton();
            assert.equal(actualNumber, '2', '2 items will be unpablished');
        });

    // Test for Publish button caption #8939
    it(`GIVEN existing scheduled site has been modified WHEN 'Publish' menu has been has been clicked THEN 'Update Scheduled' button should be displayed in the Publish Dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select and open the site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Update the site - select the 'main region' controller:
            let contextWindow = await contentWizard.openContextWindow();
            // Select the Page in widget dropdown
            await contextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            let pageInspectionPanel = new PageInspectionPanel();
            await pageInspectionPanel.selectPageTemplateOrController(appConst.CONTROLLER_NAME.MAIN_REGION);
            // 3. Click on 'Publish...' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that 'Update Scheduled' button is disabled in the modal dialog:
            await contentPublishDialog.waitForUpdateScheduledButtonDisabled();
            // 5. Click on Mark as Ready button in the modal dialog:
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('update_scheduled_button_enabled');
            // 6. Verify that 'Scheduled, Modified' status is displayed in the modal dialog:
            let actualStatus = await contentPublishDialog.getContentStatus(SITE.displayName);
            // 7. Verify that 'Update Scheduled' button gets enabled:
            await contentPublishDialog.waitForUpdateScheduledButtonEnabled();
            assert.strictEqual(actualStatus, appConst.CONTENT_STATUS.SCHEDULED_MODIFIED,
                'Scheduled, Modified status should be displayed in the dialog');
            // 8. Click on 'Update Scheduled' button in the modal dialog:
            await contentPublishDialog.clickOnUpdateScheduledButton();
            // 9. Verify that Item published - notification message appears:
            let actualMessages = await contentWizard.waitForNotificationMessages();
            let expectedMessage = appConst.itemPublishedNotificationMessage(SITE.displayName);
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
            //assert.ok(actualMessages.includes(expectedMessage), 'Item published - notification message should appear');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
