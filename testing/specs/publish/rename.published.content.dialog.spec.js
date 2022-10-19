/**
 * Created on 04.11.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('rename.published.content.dialog.spec - tests for Rename published content modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    let NEW_NAME = contentBuilder.generateRandomName('folder');
    let NOT_AVAILABLE_PATH = "all-content-types-images";

    it("Precondition - folder should be added and published",
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();
        });

    it("GIVEN existing 'published' folder is opened WHEN 'Click to modify path' icon has been clicked THEN 'Rename published content' dialog should be loaded",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //Click on 'Modify the path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            let title = await renamePublishedContentDialog.getDialogTitle();
            assert.equal(title, "Rename published content", "Expected title should be in the dialog");
            let path = await renamePublishedContentDialog.getPath();
            assert.equal(path, "/" + TEST_FOLDER.displayName, "Expected path should be in the dialog");
        });

    it("GIVEN 'Rename published content' dialog is opened WHEN new path has been typed THEN 'Rename' button gets enabled",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            //2. Verify that Rename button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
        });

    it("GIVEN new path has been typed in the modal dialog WHEN 'Cancel' button has been clicked THEN path should not be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            //2. Verify that 'Rename' button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
            await renamePublishedContentDialog.clickOnCancelButton();
            await renamePublishedContentDialog.waitForDialogClosed();
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, TEST_FOLDER.displayName, "Path in wizard page should not be updated");
            //3. Verify that 'modify path' icon is visible after canceling the modal dialog:
            await contentWizard.waitForModifyPathButtonDisplayed();
        });

    //Verifies: Path field gets unlocked after a published content is modified #5073
    it("GIVEN new path has been typed in the modal dialog WHEN 'Rename' button has been clicked THEN path should be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            //2. Verify that 'Rename' button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
            await renamePublishedContentDialog.clickOnRenameButton();
            let message = await contentWizard.waitForNotificationMessage();
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, NEW_NAME, "Path in wizard page should be updated");
            //3. Verify that 'modify path' icon remains visible in wizard page after updating the path:
            await contentWizard.waitForModifyPathButtonDisplayed();
            //4. Verify that content's status gets 'Moved'
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MOVED);
            //5. Verify that expected notification message:
            assert.equal(message, appConst.CONTENT_RENAMED, "Content has been renamed - message should be displayed");
        });

    it("GIVEN modified content has been opened WHEN the content has been unpublished THEN 'modify the path' icon should not be visible in the wizard-page",
        async () => {
            let contentWizard = new ContentWizard();
            //1. open existing Modified folder:
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            //2. Do unpublish the folder:
            await studioUtils.doUnPublishInWizard();
            await studioUtils.saveScreenshot("unpublished_content_modify_path_icon");
            //3. Verify that 'modify path' icon is not visible in unpublished content:
            await contentWizard.waitForModifyPathButtonNotDisplayed();
        });

    it("GIVEN 'Rename published content' dialog is opened WHEN the path of existing content has been typed THEN 'Not available' message should appear in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            //Publish the 'Moved' folder again:
            await contentWizard.openPublishMenuAndPublish();
            await contentWizard.pause(1000);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            //2. Type the path of existing content:
            await renamePublishedContentDialog.typeInNewNameInput(NOT_AVAILABLE_PATH);
            //3. Verify that 'Rename' button gets disabled:
            await renamePublishedContentDialog.waitForRenameButtonDisabled();
            //4. Verify that validation message is displayed:
            let validationMessage = await renamePublishedContentDialog.getValidationPathMessage();
            assert.equal(validationMessage, "Not available", "Expected validation message should appear in the input");
        });

    //Verifies -  Rename published content dialog - incorrect behaviour of validation in new name input #2472
    it("GIVEN 'Rename published content' dialog is opened WHEN content name updated twice in the modal dialog THEN 'Rename' button should be disabled in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            //2. Type available path:
            await renamePublishedContentDialog.typeInNewNameInput("test12345678");
            //3. Type a name of the existing content :
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            await studioUtils.saveScreenshot("rename-dialog_path_not_available");
            //3. Verify that 'Rename' button gets disabled now:
            await renamePublishedContentDialog.waitForRenameButtonDisabled();
        });

    it("GIVEN renamed folder has been opened THEN 'Renamed' version item should be visible in the published content",
        async () => {
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            //1. Open the folder with moved version items:
            await studioUtils.openContentAndSwitchToTabByDisplayName(NEW_NAME, TEST_FOLDER.displayName);
            //2. Open Versions widget:
            await wizardDetailsPanel.openVersionHistory();
            //3. Verify that Renamed version item is visible in the published content:
            await wizardVersionsWidget.waitForRenamedItemDisplayed();
            await studioUtils.saveScreenshot("moved_versions_after_publishing");
            //4. Verify that 2 Published version items are visible in the content:
            let publishedItems = await wizardVersionsWidget.countPublishedItems();
            assert.equal(publishedItems, 2, "Two Published items should be displayed");
            //5. Verify that one Unpublished version item is visible in the content:
            let unpublishedItems = await wizardVersionsWidget.countUnpublishedItems();
            assert.equal(unpublishedItems, 1, "One Unpublished item should be displayed");
            //6. Verify that Renamed version item remains visible:
            let renamedItems = await wizardVersionsWidget.countRenamedItems();
            assert.equal(renamedItems, 1, "1 Renamed item remains visible");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
