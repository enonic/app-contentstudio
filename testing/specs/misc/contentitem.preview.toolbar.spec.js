/**
 * Created on 21.06.2018.  updated on 16.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CompareWithPublishedVersionDialog = require('../../page_objects/compare.with.published.version.dialog');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');

describe('contentItem.preview.toolbar.spec: tests for preview toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let TEST_FOLDER;

    it(`WHEN existing folder has been selected THEN 'Version history' button should be displayed in the preview-toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Add new folder and select it:
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('content_item_toolbar');
            // 2. Verify that 'Open version history' button is displayed in Item Preview toolbar:
            await contentItemPreviewPanel.waitForVersionHistoryButtonDisplayed();
        });

    it(`WHEN existing folder has been unselected THEN Preview toolbar gets not visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. select a folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Preview Dropdown should be displayed on the ContentItemPreviewToolbar:
            await contentItemPreviewPanel.waitForPreviewWidgetDropdownDisplayed();
            await contentItemPreviewPanel.waitForVersionHistoryButtonDisplayed();
            // 3. unselect the folder:
            await contentBrowsePanel.clickOnRowByDisplayName(TEST_FOLDER.displayName);
            // 4. Preview toolbar should not be displayed
            await contentItemPreviewPanel.waitForPreviewToolbarNotDisplayed();
            await contentItemPreviewPanel.waitForVersionHistoryButtonNotDisplayed();
        });

    it(`GIVEN existing folder has been published WHEN 'Versions history' button has been clicked THEN 'Online' status should be displayed in the widget`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentPublishDialog = new ContentPublishDialog();
            let browseVersionsWidget =  new BrowseVersionsWidget();
            // 1. Select the folder
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Click on 'Mark on ready' button in the browse toolbar:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            // 3. Verify that Publish wizard is loaded
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            // 3. Click on 'Versions toggle' button
            await contentItemPreviewPanel.clickOnOpenVersionHistoryButton();
            // 4. Verify that Version Widget is loaded:
            await browseVersionsWidget.waitForLoaded();
            // 3. 'Online' status should be displayed in the Versions History Button:
            let label = await contentItemPreviewPanel.getLabelInOpenVersionsHistoryButton();
            // TODO https://github.com/enonic/app-contentstudio/issues/10256
            //assert.equal(label, 'Version history', 'Versions History Button should be with the default label');
        });

    it(`WHEN published folder has been modified THEN 'Modified' label should appear in Versions History Button`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentWizard = new ContentWizard();
            let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
            // 1. Open and update the published folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.clearDisplayNameInput();
            await contentWizard.typeDisplayName(appConst.generateRandomName('test'));
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            await studioUtils.saveScreenshot('show_changes_button_browse_panel');
            // 2. Verify that 'Online' status in the Browse Panel:
            let label = await contentItemPreviewPanel.getLabelInOpenVersionsHistoryButton();
            assert.equal(label, appConst.CONTENT_STATUS.MODIFIED, `'Modified' label should appear in Versions History Button`);
            // TODO update the test
            // 3.  Open 'Compare Versions' modal dialog
            //await click on Show changes in Version history widget
            //await compareWithPublishedVersionDialog.waitForDialogOpened();
        });

    it.skip(`GIVEN modified folder is selected WHEN the folder has been published THEN 'Show changes' button gets hidden in the item preview toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. select the 'modified' folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.name);
            // 2. Publish the folder:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('show_changes_button_hidden');
            // 3. Verify that 'Show Changes' button gets hidden in the preview toolbar:
            //await contentItemPreviewPanel.waitForShowChangesButtonNotDisplayed();
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
