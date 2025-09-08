/**
 * Created on 12.10.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const StatusWidget = require('../../page_objects/browsepanel/detailspanel/status.widget.itemview');

describe('moved.modified.content.spec - tests for content with Moved, Modified content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    const NEW_NAME = appConst.generateRandomName('folder');

    it('Precondition - new folder should be added and published',
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();
        });

    it("GIVEN existing published folder has been opened WHEN the path has been modified THEN 'Moved' status should appear in the wizard toolbar",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Click on the locked 'path input' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            // 2. Modify the path and click on 'Rename' button:
            await renamePublishedContentDialog.clickOnRenameButton();
            await renamePublishedContentDialog.waitForDialogClosed();
            // 3. Verify that 'modify path' span remains visible in wizard page after updating the path:
            await contentWizard.waitForModifyPathSpanDisplayed();
            // 4. Open Page Editor with Preview Widget, Verify that status gets Moved
            await contentWizard.clickOnPageEditorToggler();
            await studioUtils.saveScreenshot('moved_folder');
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MOVED);
            // 5. Verify that status gets 'Moved' in the wizard-toolbar:
            let actualStatus = await contentWizard.getContentStatus();
            assert.equal(actualStatus, appConst.CONTENT_STATUS.MOVED, `Only the one 'Moved' status should appear in the wizard toolbar`);
            // 6. Verify that 'Moved' status gets visible in the status widget in Details Widget Panel:
            await contentWizard.openDetailsWidget();
            let statusWidget = new StatusWidget();
            await statusWidget.waitForStatusDisplayed(appConst.STATUS_WIDGET.MOVED);
        });

    it("GIVEN 'Moved' content has been opened WHEN the description has been updated THEN 'Moved, Modified' statuses gets visible in the wizard-toolbar",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. open the existing Moved folder:
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            await contentWizard.openDetailsWidget();
            // 2. Select a language, the content gets 'moved, modified':
            let editDetailsDialog = await studioUtils.openEditSettingDialog();
            await editDetailsDialog.waitForLoaded();
            await editDetailsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editDetailsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            await studioUtils.saveScreenshot('moved_modified_folder');
            // 4. Open Page Editor with Preview Widget, Verify that status gets Moved, Modified
            await contentWizard.clickOnPageEditorToggler();
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MOVED_MODIFIED);
            let actualStatus = await contentWizard.getContentStatus();
            assert.equal(actualStatus, appConst.CONTENT_STATUS.MOVED_MODIFIED,
                `'Moved, Modified' status should appear in the wizard toolbar`);
            // 5. Verify that 'Moved, Modified' status gets visible in the status widget in Details Panel:
            await contentWizard.openDetailsWidget();
            let statusWidget = new StatusWidget();
            await statusWidget.waitForStatusDisplayed(appConst.STATUS_WIDGET.MOVED_MODIFIED);
        });

    it("GIVEN 'Moved, Modified' folder is opened WHEN the folder has been marked as ready THEN its status gets 'Moved'",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. open the existing Moved folder:
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            // 2. Click on 'Mark as ready' button and open  'Publish wizard':
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await contentPublishDialog.waitForDialogOpened();
            // 3. Close the modal dialog
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('moved_modified_folder_mark_as_ready');
            // 4. Open Page Editor with Preview Widget, Verify that status gets Moved
            await contentWizard.clickOnPageEditorToggler();
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MOVED);
            // 5. Verify that 'Moved' status gets visible in the status widget in Details Panel:
            let actualStatus = await contentWizard.getContentStatus();
            assert.equal(actualStatus, appConst.CONTENT_STATUS.MOVED, `'Moved' status should appear in the wizard toolbar`);
            await contentWizard.openDetailsWidget();
            let statusWidget = new StatusWidget();
            // 5. Verify that 'Moved' status gets visible in the status widget after clicking on Mark as ready:
            await statusWidget.waitForStatusDisplayed(appConst.STATUS_WIDGET.MOVED);
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
