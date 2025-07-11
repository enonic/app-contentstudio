/**
 * Created on 04.11.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('rename.published.content.dialog.spec - tests for Rename published content modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    let NEW_NAME = contentBuilder.generateRandomName('folder');
    const NEW_AVAILABLE_NAME = 'test12345678';
    // existing imported folder:
    let NOT_AVAILABLE_PATH = appConst.TEST_FOLDER_WITH_IMAGES_NAME;
    const DIALOG_HEADER = 'Rename published content';

    it('Precondition - folder should be added and published',
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();
        });

    it("GIVEN existing 'published' folder is opened WHEN locked path input has been clicked THEN 'Rename published content' dialog should be loaded",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //  Click on the locked 'path input' and open the modal dialog
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            let title = await renamePublishedContentDialog.getDialogTitle();
            assert.equal(title, DIALOG_HEADER, 'Expected title should be in the dialog');
            let path = await renamePublishedContentDialog.getPath();
            assert.equal(path, '/' + TEST_FOLDER.displayName, "Expected path should be in the dialog");
        });

    it("GIVEN 'Rename published content' dialog is opened WHEN new path has been typed THEN 'Rename' button gets enabled",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Click on the locked 'path input' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            // 2. Verify that Rename button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
        });

    it("GIVEN new path has been typed in the modal dialog WHEN 'Cancel' button has been clicked THEN path should not be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            // 2. Verify that 'Rename' button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
            await renamePublishedContentDialog.clickOnCancelButton();
            await renamePublishedContentDialog.waitForDialogClosed();
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, TEST_FOLDER.displayName, "Path in wizard page should not be updated");
            // 3. Verify that 'Click to rename the content' tooltip is present in wizard header after canceling the modal dialog:
            await contentWizard.waitForModifyPathSpanDisplayed();
        });

    it("GIVEN published content has been opened WHEN cursor moved to the path input THEN 'Click to the rename the content' tooltip should be displayed",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Move mouse to the 'path' input:
            await contentWizard.moveMouseToModifyPathSpan();
            await studioUtils.saveScreenshot('click_to_rename_the_content_tooltip1');
            // 2. Verify that tooltip appears
            await contentWizard.waitForModifyPathTooltipDisplayed();
        });

    // Verifies: Path field gets unlocked after a published content is modified #5073
    it("GIVEN new path has been typed in the modal dialog WHEN 'Rename' button has been clicked THEN path should be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            // 2. Verify that 'Rename' button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
            await renamePublishedContentDialog.clickOnRenameButton();
            let message = await contentWizard.waitForNotificationMessage();
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, NEW_NAME, 'Path in wizard page should be updated');
            // 3. Verify that 'Click to rename the content' tooltip is present in wizard header after updating the path:
            await contentWizard.waitForModifyPathSpanDisplayed();
            await contentWizard.clickOnPageEditorToggler();
            await studioUtils.saveScreenshot('click_to_rename_the_content_tooltip');
            // 4. Verify that content's status gets 'Moved'
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MOVED);
            // 5. Verify that expected notification message:
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.CONTENT_RENAMED, "'Content has been renamed' - this message should be displayed");
        });

    it("GIVEN 'moved' content has been opened WHEN the content has been unpublished THEN 'modify the path' icon should not be visible in the wizard-page",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. open existing 'Moved' folder:
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            // 2. Do unpublish the folder:
            await studioUtils.doUnPublishInWizard();
            // Open the Page Editor with Preview Widget:
            await contentWizard.clickOnPageEditorToggler();
            await studioUtils.saveScreenshot('unpublished_content_modify_path_icon');
            //3. Verify that span with 'Click to rename the content' is not displayed for the unpublished content:
            await contentWizard.waitForModifyPathSpanNotDisplayed();
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.UNPUBLISHED);
        });

    it("GIVEN 'Rename published content' dialog is opened WHEN the path of existing content has been typed THEN 'Not available' message should appear in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            // Publish the 'Moved' folder again:
            await contentWizard.openPublishMenuAndPublish();
            await contentWizard.pause(1000);
            // 1. Click on the locked 'path input' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            // 2. Type the path of existing content:
            await renamePublishedContentDialog.typeInNewNameInput(NOT_AVAILABLE_PATH);
            // 3. Verify that 'Rename' button gets disabled:
            await renamePublishedContentDialog.waitForRenameButtonDisabled();
            // 4. Verify that validation message is displayed:
            let validationMessage = await renamePublishedContentDialog.getValidationPathMessage();
            assert.equal(validationMessage, 'Not available', 'Expected validation message should appear in the input');
        });

    // Verifies -  Rename published content dialog - incorrect behaviour of validation in new name input #2472
    it("GIVEN 'Rename published content' dialog is opened WHEN content name updated twice in the modal dialog THEN 'Rename' button should be disabled in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            // 1. Click on the locked 'path input' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnNameInputOpenModifyPathDialog();
            // 2. Type an available name:
            await renamePublishedContentDialog.typeInNewNameInput(NEW_AVAILABLE_NAME);
            // 3. Type a name of the existing content :
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            await studioUtils.saveScreenshot('rename-dialog_path_not_available');
            // 3. Verify that 'Rename' button gets disabled now:
            await renamePublishedContentDialog.waitForRenameButtonDisabled();
        });

    it("GIVEN renamed folder has been opened THEN 'Renamed' version item should be visible in the published content",
        async () => {
            let wizardContextPanel = new WizardContextPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open the folder with moved version items:
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            // 2. Open Versions widget:
            await wizardContextPanel.openVersionHistory();
            // 3. Verify that Renamed version item is visible in the published content:
            await wizardVersionsWidget.waitForRenamedItemDisplayed();
            await studioUtils.saveScreenshot('moved_versions_after_publishing');
            // 4. Verify that 2 Published version items are visible in the content:
            let publishedItems = await wizardVersionsWidget.countPublishedItems();
            assert.equal(publishedItems, 2, 'Two Published items should be displayed');
            // 5. Verify that one Unpublished version item is visible in the content:
            let unpublishedItems = await wizardVersionsWidget.countUnpublishedItems();
            assert.equal(unpublishedItems, 1, 'One Unpublished item should be displayed');
            // 6. Verify that Renamed version item remains visible:
            let renamedItems = await wizardVersionsWidget.countRenamedItems();
            assert.equal(renamedItems, 1, '1 Renamed item remains visible');
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
