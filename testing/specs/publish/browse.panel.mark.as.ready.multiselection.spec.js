/**
 * Created on 05.09.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('browse.panel.mark.as.ready.multiselection.spec - select 2 folders and do Mark as Ready action`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER1;
    let TEST_FOLDER2;

    it(`GIVEN 2 folders are added WHEN both folder has been selected and 'MARK AS READY' button pressed THEN confirmation dialog should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let name1 = contentBuilder.generateRandomName('folder');
            let name2 = contentBuilder.generateRandomName('folder');
            TEST_FOLDER1 = contentBuilder.buildFolder(name1);
            TEST_FOLDER2 = contentBuilder.buildFolder(name2);
            // 1. Two folders have been added:
            await studioUtils.doAddFolder(TEST_FOLDER1);
            await studioUtils.doAddFolder(TEST_FOLDER2);
            // 2. Click on checkboxes and select both folders:
            await studioUtils.findContentAndClickCheckBox(name1);
            await studioUtils.findContentAndClickCheckBox(name2);
            // 3. Click on 'MARK AS READY' button
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await confirmationDialog.waitForDialogOpened();
            let message = await confirmationDialog.getWarningMessage();

            await studioUtils.saveScreenshot("mark_as_ready_confirmation");
            assert.equal(message, "Are you sure you want to mark the items as ready?");
        });

    it(`WHEN single folder has been selected and 'MARK AS READY' button pressed THEN no confirmation needed for single content, the content gets 'Ready for publishing'`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let name = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(name);
            // the folder has been added:
            await studioUtils.doAddFolder(folder);
            // Click on checkboxes and select the folder:
            await studioUtils.findContentAndClickCheckBox(name);
            // Click on 'MARK AS READY' button, no confirmation needed for single content:
            await contentBrowsePanel.clickOnMarkAsReadyButton();

            let message = await contentBrowsePanel.waitForNotificationMessage();
            let expectedMessage = appConst.itemMarkedAsReadyMessage(folder.displayName);
            await studioUtils.saveScreenshot('mark_as_ready_confirmation');
            assert.equal(message, expectedMessage, "Item is marked as ready - message should appear");
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
