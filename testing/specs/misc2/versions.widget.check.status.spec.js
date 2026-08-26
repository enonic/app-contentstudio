/**
 * Created on 29.02.2020. updated on 26.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');

describe('versions.widget.check.status.spec - check content status in Versions Panel`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;

    it(`WHEN the folder has been published THEN 'Online' status should be displayed in the top item in Version Widget`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
        let browseVersionsWidget = new BrowseVersionsWidget();
        let displayName = contentBuilder.generateRandomName('folder');
        FOLDER = contentBuilder.buildFolder(displayName);
        // 1. add new folder and do publish one
        await studioUtils.doAddReadyFolder(FOLDER);
        await studioUtils.findAndSelectItem(FOLDER.displayName);
        await studioUtils.openDialogAndPublishSelectedContent();
        let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
        let expectedMessage = appConst.itemPublishedNotificationMessage(FOLDER.displayName);
        assert.equal(actualMessage, expectedMessage, `'Item is published' - message should appear`);
        // 2. Verify the default action gets 'Unpublish' in Publish menu:
        await contentBrowsePanel.waitForUnPublishButtonVisible();
        // 3. Verify that 'publish menu' is available:
        await contentBrowsePanel.waitForShowPublishMenuDropDownVisible();
        // 4. Open version panel and verify status in the top version-item:
        await contentBrowsePanel.openContextWindow();
        await contentBrowseDetailsPanel.openVersionHistory();
        await browseVersionsWidget.waitForLoaded();
        await browseVersionsWidget.clickOnShowAllActiviesCheckbox();
        // 5. Verify that 'Published' list-item appears in the widget:
        let markAsReadyItems = await browseVersionsWidget.countMarkedAsReadyItems();
        assert.equal(markAsReadyItems, 1, `'markAsReady' version item should appear in the widget`);
        let result = await browseVersionsWidget.countPublishedItems();
        assert.equal(result, 1, `'Published' version item should appear in the widget`);
        await browseVersionsWidget.clickOnShowAllActiviesCheckbox();
        let status = await browseVersionsWidget.getContentStatusInTopItem();
        assert.equal(status, appConst.CONTENT_STATUS.ONLINE, `'Online' status should be in the top version item`);
    });

    it(`WHEN existing folder(Published) has been modified THEN content status should should not be displayed in the top item in Versions Widget`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
        let browseVersionsWidget = new BrowseVersionsWidget();
        let contentWizard = new ContentWizard();
        // 1. open the folder and select a language:
        await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
        await contentWizard.openContextWindow();
        await contentWizard.openDetailsWidget();
        // 3. Open 'Edit Setting' modal dialog:
        let editDetailsDialog = await studioUtils.openEditSettingDialog();
        await editDetailsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
        await editDetailsDialog.clickOnApplyButton();
        await editDetailsDialog.waitForClosed();
        await contentWizard.waitForNotificationMessage();
        await studioUtils.doCloseWindowTabAndSwitchToBrowsePanel();
        //2. Open version panel and verify status in the latest version-item:
        await contentBrowsePanel.openContextWindow();
        await contentBrowseDetailsPanel.openVersionHistory();
        await browseVersionsWidget.waitForLoaded();
        let status = await browseVersionsWidget.getContentStatusInTopItem();
        assert.equal(status, '', `content status should should not be displayed in the top item in Versions Widget`);
    });

    it("GIVEN existing folder(Modified) is selected WHEN the content has been published THEN 'Online' status should be in the top item in Versions Widget", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
        let browseVersionsWidget = new BrowseVersionsWidget();
        // 1. Select the folder and publish it:
        await studioUtils.findAndSelectItem(FOLDER.displayName);
        await contentBrowsePanel.hotKeyPublish();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on 'Mark as ready' button in the modal dialog:
        await contentPublishDialog.clickOnMarkAsReadyButton();
        // 3. Click on Publish now in the modal dialog:
        await contentPublishDialog.clickOnPublishNowButton();
        await contentBrowsePanel.pause(500);
        // 4. Open version panel and verify status in the top version-item:
        await contentBrowsePanel.openContextWindow();
        await contentBrowseDetailsPanel.openVersionHistory();
        await browseVersionsWidget.waitForLoaded();
        let status = await browseVersionsWidget.getContentStatusInTopItem();
        assert.equal(status, appConst.CONTENT_STATUS.ONLINE, `'Online' status should be in the top version item`);
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
