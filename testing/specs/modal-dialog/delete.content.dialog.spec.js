/**
 * Created on 04.10.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const PublishContentDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('delete.content.dialog.spec:  tests for Delete Content Dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER1;
    let FOLDER2;
    it(`Precondition: two folders should be added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            FOLDER1 = contentBuilder.buildFolder(displayName2);
            FOLDER2 = contentBuilder.buildFolder(displayName1);
            await studioUtils.doAddFolder(FOLDER1);
            await studioUtils.doAddFolder(FOLDER2);
        });

    // verifies - https://github.com/enonic/app-contentstudio/issues/1032  Delete button is missing a number of items to delete
    it(`GIVEN two folders are checked WHEN 'Delete Content Dialog' has been opened THEN expected number(2) should be present in the Delete button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Select 2 folders
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            // 2. Click on Delete... button in the toolbar:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('2_folders_to_delete');
            // 3. Verify the number in Archive button
            let result = await deleteContentDialog.getNumberInDeleteButton();
            assert.equal(result, '2', "Expected number of content (2) should be present in the Delete button");
        });

    it(`GIVEN two folders are checked WHEN 'Publish Content Dialog' has been opened THEN expected number(2) should be present in the Publish button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let publishContentDialog = new PublishContentDialog();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select 2 folders
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            // 2. Click on Mark as ready button
            await contentBrowsePanel.clickOnMarkAsReadyButtonAndConfirm();
            // 3. Publish Wizard should be loaded automatically
            await contentPublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('2_folders_to_publish');
            // 3. Verify the number of items in 'Publish Now' button
            let result = await publishContentDialog.getNumberItemsToPublish();
            assert.equal(result, '2', "Expected number of content (2) should be present in the 'Publish now' button");
        });

    it(`"WHEN one content was selected AND 'Delete Content Dialog' has been opened THEN expected buttons and content status should be displayed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findAndSelectItem(FOLDER1.displayName);
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            let status = await deleteContentDialog.getContentStatus(FOLDER1.displayName);
            assert.equal(status, appConst.CONTENT_STATUS.OFFLINE, 'Offline status should be displayed');
            await deleteContentDialog.waitForCloseButtonDisplayed();
            await deleteContentDialog.waitForDeleteButtonEnabled();

            let itemsToArchiveOrDelete = await deleteContentDialog.getMainItemsToDeleteDisplayName();
            assert.equal(itemsToArchiveOrDelete[0], FOLDER1.displayName, "Expected display names should be present");
        });

    it(`GIVEN 'Delete Content' dialog is opened WHEN 'Close' button has been pressed THEN dialog closes`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Open Delete content Dialog
            await studioUtils.findAndSelectItem(FOLDER1.displayName);
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            // 2. Click on Close button
            await deleteContentDialog.clickOnCloseButton();
            await deleteContentDialog.waitForDialogClosed();
        });

    it(`GIVEN existing published content is selected WHEN Delete Dialog has been opened THEN 'Online' status should be displayed in the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1.Select and publish the folder:
            await studioUtils.findAndSelectItem(FOLDER1.displayName);
            await studioUtils.openDialogAndPublishSelectedContent();
            // 2. Open Delete content Dialog:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();

            let isDisplayed = await deleteContentDialog.isDeleteButtonDisplayed();
            assert.ok(isDisplayed, "'Delete' button should be displayed in the modal dialog");

            let status = await deleteContentDialog.getContentStatus(FOLDER1.displayName);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, 'Online status should be displayed');
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
