/**
 * Created on 12.11.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');

describe('archive.confirm.content.dialog.spec:  tests for archiving content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DIALOG_TITLE = 'Confirm archive';

    let FOLDER1;
    let FOLDER2;
    it(`Precondition: two folders should be added`,
        async () => {
            let displayName1 = appConst.generateRandomName('folder');
            let displayName2 = appConst.generateRandomName('folder');
            FOLDER1 = contentBuilder.buildFolder(displayName2);
            FOLDER2 = contentBuilder.buildFolder(displayName1);
            await studioUtils.doAddFolder(FOLDER1);
            await studioUtils.doAddFolder(FOLDER2);
        });

    it(`WHEN 'Archive...' menu item has been clicked in Grid Context Menu THEN 'Delete/Archive' dialog should be loaded`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Select a folder
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            // 2.Click on 'Archive...' menu item in grid context menu:
            await contentBrowsePanel.rightClickOnItemByDisplayName(FOLDER1.displayName);
            await studioUtils.saveScreenshot('archive-context-menu');
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.ARCHIVE);
            await contentBrowsePanel.clickOnMenuItem(appConst.GRID_CONTEXT_MENU.ARCHIVE);
            await contentBrowsePanel.pause(400);
            await studioUtils.saveScreenshot('single_folder_archive');
            // 3. Verify that the modal dialog is loaded:
            await deleteContentDialog.waitForDialogOpened();
        });

    it(`GIVEN two folders are checked AND 'Delete Content Dialog' is opened WHEN 'Archive' button in the dialog has been clicked THEN 'Confirm archive' dialog should be opened`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. Select 2 folders
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            // 2. Click on 'Archive...' button in the toolbar:
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('2_folders_to_archive');
            // 3. Click on Archive button in the modal dialog:
            await deleteContentDialog.clickOnArchiveButton();
            // 4. 'Confirm Value' dialog should be loaded:
            await confirmValueDialog.waitForDialogOpened();
            // 5. Verify the title in the dialog
            let titleActual = await confirmValueDialog.getDialogTitle();
            assert.equal(titleActual, DIALOG_TITLE, `'Confirm archive' title should be displayed in the dialog`);
            // 6. Fill in the number input:
            await confirmValueDialog.typeNumberOrName(2);
            // 7. Verify that Confirm button gets enabled:
            await confirmValueDialog.clickOnConfirmButton();
            // 8. Verify the notification message:
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, '2 items have been archived', '2 items have been archived -  notification message should appear');
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
