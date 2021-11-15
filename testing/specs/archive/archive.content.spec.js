/**
 * Created on 12.11.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const PublishContentDialog = require('../../page_objects/content.publish.dialog');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');

describe('archive.content.dialog.spec:  tests for archiving content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const DIALOG_TITLE = "Confirm archive";

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
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Select a folder
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            //2.Click on 'Archive...' menu item in grid context menu:
            await contentBrowsePanel.rightClickOnItemByDisplayName(FOLDER1.displayName);
            await studioUtils.saveScreenshot("archive-context-menu");
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.ARCHIVE);
            await contentBrowsePanel.clickOnMenuItem(appConst.GRID_CONTEXT_MENU.ARCHIVE);
            await contentBrowsePanel.pause(400);
            await studioUtils.saveScreenshot("single_folder_archive");
            //3. Verify that the modal dialog is loaded:
            await deleteContentDialog.waitForDialogOpened();
        });


    it(`GIVEN two folders are checked AND 'Delete Content Dialog' is opened WHEN 'Archive' button in the dialog has been clicked THEN 'Confirm archive' dialog should be opened`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Select 2 folders
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            //2. Click on 'Archive...' button in the toolbar:
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot("2_folders_to_delete");
            //3. Click on Archive button in the modal dialog:
            await deleteContentDialog.clickOnArchiveButton();
            //4. 'Confirm Value' dialog should be loaded:
            await confirmValueDialog.waitForDialogOpened();
            //5. Verify the title in the dialog
            let titleActual = await confirmValueDialog.getDialogTitle();
            assert.equal(titleActual, DIALOG_TITLE, "Expected title should be displayed in the dialog");
            //6. Fill in the number input:
            await confirmValueDialog.typeNumberOrName(2);
            //7. Verify that Confirm button gets enabled:
            await confirmValueDialog.clickOnConfirmButton();
            //8. Verify the notification message:
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, "2 items are archived", "Expected notification message should appear");
        });

    // it(`GIVEN two folders are checked WHEN 'Publish Content Dialog' has been opened THEN expected number(2) should be present in the Publish button`,
    //     async () => {
    //         let contentBrowsePanel = new ContentBrowsePanel();
    //         let publishContentDialog = new PublishContentDialog();
    //         //1. Select 2 folders
    //         await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
    //         await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
    //         //2. Open Publish Wizard
    //         await contentBrowsePanel.clickOnMarkAsReadyButtonAndConfirm();
    //         await contentBrowsePanel.clickOnPublishButton();
    //         await publishContentDialog.waitForDialogOpened();
    //         await studioUtils.saveScreenshot("2_folders_to_publish");
    //         //3. Verify the number of items in 'Publish Now' button
    //         let result = await publishContentDialog.getNumberItemsToPublish();
    //         assert.equal(result, '2', "Expected number of content (2) should be present in the 'Publish now' button");
    //     });
    //
    // it(`"WHEN existing folder is selected and 'Delete Content Dialog' has been opened THEN expected elements should be present`,
    //     async () => {
    //         let contentBrowsePanel = new ContentBrowsePanel();
    //         let deleteContentDialog = new DeleteContentDialog();
    //         await studioUtils.findAndSelectItem(FOLDER1.displayName);
    //         await contentBrowsePanel.clickOnArchiveButton();
    //         await deleteContentDialog.waitForDialogOpened();
    //
    //         let status = await deleteContentDialog.getContentStatus(FOLDER1.displayName);
    //         assert.equal(status, "New", 'New status should be displayed');
    //
    //         let isCancelButtonDisplayed = await deleteContentDialog.isCancelButtonDisplayed();
    //         assert.isTrue(isCancelButtonDisplayed, 'Cancel button should be displayed');
    //
    //         let isArchiveButtonDisplayed = await deleteContentDialog.isArchiveButtonDisplayed();
    //         assert.isTrue(isArchiveButtonDisplayed, "'Archive...' button should be displayed");
    //
    //         let isCancelTopButtonDisplayed = await deleteContentDialog.isCancelTopButtonDisplayed();
    //         assert.isTrue(isCancelTopButtonDisplayed, 'Cancel top button should be displayed');
    //         //'Delete Menu should be displayed
    //         await deleteContentDialog.waitForArchiveMenuDropDownHandleDisplayed();
    //
    //         let itemsToArchiveOrDelete = await deleteContentDialog.getDisplayNamesToArchiveOrDelete();
    //         assert.equal(itemsToArchiveOrDelete[0], FOLDER1.displayName, "Expected display names should be present");
    //     });
    //
    // it(`GIVEN 'Delete Content' dialog is opened WHEN 'Cancel' button has been pressed THEN dialog closes`,
    //     async () => {
    //         let contentBrowsePanel = new ContentBrowsePanel();
    //         let deleteContentDialog = new DeleteContentDialog();
    //         //1. Open Delete Dialog
    //         await studioUtils.findAndSelectItem(FOLDER1.displayName);
    //         await contentBrowsePanel.clickOnArchiveButton();
    //         await deleteContentDialog.waitForDialogOpened();
    //         //2. Click on Cancel button
    //         await deleteContentDialog.clickOnCancelButton();
    //         await deleteContentDialog.waitForDialogClosed();
    //     });
    //
    // it(`GIVEN 'Delete Content' dialog is opened WHEN 'Cancel top' button has been pressed THEN dialog closes`,
    //     async () => {
    //         let contentBrowsePanel = new ContentBrowsePanel();
    //         let deleteContentDialog = new DeleteContentDialog();
    //         //1. Open Delete Dialog
    //         await studioUtils.findAndSelectItem(FOLDER1.displayName);
    //         await contentBrowsePanel.clickOnArchiveButton();
    //         await deleteContentDialog.waitForDialogOpened();
    //         //2. Click on Cancel Top button
    //         await deleteContentDialog.clickOnCancelTopButton();
    //         await deleteContentDialog.waitForDialogClosed();
    //     });
    //
    // it(`GIVEN existing published content is selected WHEN Delete Dialog has been opened THEN Delete menu should be present in the dialog`,
    //     async () => {
    //         let contentBrowsePanel = new ContentBrowsePanel();
    //         let deleteContentDialog = new DeleteContentDialog();
    //         //1.Select and publish the folder:
    //         await studioUtils.findAndSelectItem(FOLDER1.displayName);
    //         await studioUtils.doPublish();
    //         //2. Open Delete Dialog:
    //         await contentBrowsePanel.clickOnArchiveButton();
    //         await deleteContentDialog.waitForDialogOpened();
    //
    //         let isDisplayed = await deleteContentDialog.isArchiveButtonDisplayed();
    //         assert.isTrue(isDisplayed, "Archive button should be present");
    //         //3. Delete menu should be displayed in the dialog:
    //         let isDropdownHandleDisplayed = await deleteContentDialog.isArchiveMenuDropDownHandleDisplayed();
    //         assert.isTrue(isDropdownHandleDisplayed, "Delete menu should appear in the dialog");
    //
    //         let status = await deleteContentDialog.getContentStatus(FOLDER1.displayName);
    //         assert.equal(status, "Published", 'Published status should be displayed');
    //     });
    //
    //
    // it(`GIVEN 'published' folder is selected AND 'Delete dialog' is opened WHEN 'Delete Now' button has been pressed THEN the folder should be deleted`,
    //     async () => {
    //         let contentBrowsePanel = new ContentBrowsePanel();
    //         let deleteContentDialog = new DeleteContentDialog();
    //         //1. Click on the checkbox and select the folder:
    //         await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
    //         //2. Open Delete Dialog:
    //         await contentBrowsePanel.clickOnArchiveButton();
    //         await deleteContentDialog.waitForDialogOpened();
    //         //3. Click on 'Delete Now' menu item
    //         await deleteContentDialog.clickOnDeleteNowMenuItem();
    //         await contentBrowsePanel.waitForContentNotDisplayed(FOLDER1.displayName);
    //     });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
