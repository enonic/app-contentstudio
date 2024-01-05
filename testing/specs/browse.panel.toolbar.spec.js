/**
 * Created on 16.07.2019.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const appConst = require('../libs/app_const');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');

describe('Browse panel, toolbar spec. Check state of buttons on the grid-toolbar after closing a wizard page', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER_NAME;
    let FOLDER
    let CHILD_FOLDER;

    let SITE;
    // verifies https://github.com/enonic/app-contentstudio/issues/645
    // Buttons on toolbar are not correctly updated after closing a content-wizard
    it(`GIVEN existing site is selected  AND 'New' button has been pressed WHEN new folder has been saved and the wizard closed THEN toolbar-buttons should be in expected state`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site-test');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            FOLDER_NAME = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(FOLDER_NAME);
            // opens folder-wizard, types a name and saves it then closes the wizard.
            await studioUtils.doAddFolder(folder);
            //'Publish' button should be displayed on the toolbar after closing a wizard with child content
            await contentBrowsePanel.waitForPublishButtonVisible();
            //'Edit' button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            //'Archive' button should be enabled
            await contentBrowsePanel.waitForArchiveButtonEnabled();
            //'Move' button should be enabled
            await contentBrowsePanel.waitForMoveButtonEnabled();
        });

    // Verify "Move" action is disabled in the search view #4035
    it(`search for some content WHEN the content has been selected THEN Move button should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await studioUtils.saveScreenshot("content_in_filtered_grid");
            //'Publish' button should be displayed on the toolbar after closing a wizard with child content
            await contentBrowsePanel.waitForMarkAsReadyButtonVisible();
            //'Edit' button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            //'Archive' button should be enabled
            await contentBrowsePanel.waitForArchiveButtonEnabled();
            //'Move' button should be enabled
            await contentBrowsePanel.waitForMoveButtonEnabled();
            await contentBrowsePanel.waitForDuplicateButtonEnabled();
            await contentBrowsePanel.waitForPreviewButtonDisabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
        });

    it(`GIVEN existing site is selected WHEN the site (children are not included) has been published THEN 'Publish Tree' button should appear on the toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            // do publish the site(children are not included)
            await studioUtils.openDialogAndPublishSelectedContent();
            // 'Publish tree' button  gets visible
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });

    it(`WHEN no selected content THEN all buttons on the toolbar should be in expected state`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.waitForNewButtonEnabled();
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForArchiveButtonDisabled();
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
            await contentBrowsePanel.waitForMoveButtonDisabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            await contentBrowsePanel.waitForPreviewButtonDisabled();
            await contentBrowsePanel.waitForCreateIssueButtonDisplayed();
            await contentBrowsePanel.waitForDetailsPanelToggleButtonDisplayed();
        });

    it(`WHEN image is selected (not allowing children) THEN 'Sort' and 'New' buttons should be  disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.HAND);
            await contentBrowsePanel.waitForEditButtonEnabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            // New button should be disabled, because children are not allowed for images.
            await contentBrowsePanel.waitForNewButtonDisabled();
            await contentBrowsePanel.waitForPreviewButtonDisabled();
        });

    it(`GIVEN new folder is added WHEN the folder has been selected THEN 'Sort' buttons should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.waitForEditButtonEnabled();
            // 'Sort' button should be disabled, because this folder is empty!
            await contentBrowsePanel.waitForSortButtonDisabled();
            // 'New' button should be enabled, because children are allowed for folder-content.
            await contentBrowsePanel.waitForNewButtonEnabled();
        });

    it(`GIVEN single folder is selected WHEN a child folder has been added THEN 'Sort' buttons gets enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('child');
            CHILD_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Select a folder and add a child folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            // 2.  'Sort' button gets enabled, because child folder was added:
            await contentBrowsePanel.waitForSortButtonEnabled();
            await contentBrowsePanel.waitForEditButtonEnabled();
            await contentBrowsePanel.waitForMoveButtonEnabled();
        });

    it(`GIVEN the parent folder is selected WHEN child folder has been deleted THEN 'Sort' buttons should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 1. Click on the child folder:
            await contentBrowsePanel.clickOnExpanderIcon(FOLDER.displayName);
            await contentBrowsePanel.clickOnRowByName(CHILD_FOLDER.displayName)
            // 2. delete the child folder:
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await deleteContentDialog.waitForDialogClosed();
            await contentBrowsePanel.waitForNotificationMessage();
            // 3. select the parent folder:
            await contentBrowsePanel.clickOnRowByName(FOLDER.displayName);
            // 4. Verify that 'Sort' button should be disabled, because child folder has been deleted:
            await contentBrowsePanel.waitForSortButtonDisabled();
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
