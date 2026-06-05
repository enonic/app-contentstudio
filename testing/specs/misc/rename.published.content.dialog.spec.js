/**
 * Created on 04.11.2020.  updated on 04.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const RenameContentDialog = require("../../page_objects/wizardpanel/rename.content.dialog");
const DetailsWidgetContentSection = require("../../page_objects/details_panel/details.widget.content.section");

describe('rename.published.content.dialog.spec - tests for Rename published content modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    let NEW_NAME = appConst.generateRandomName('folder');
    // existing imported folder:
    let NOT_AVAILABLE_PATH = appConst.TEST_FOLDER_WITH_IMAGES_NAME;

    it('Precondition - folder should be added and published',
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();
        });

    it("GIVEN existing 'published' folder is opened WHEN open button clicked and  Rename content dialog has been opened THEN expected name should be displayed in the input",
        async () => {
            let contentWizard = new ContentWizard();
            let renameContentDialog = new RenameContentDialog();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //  Click on  'path input' and open the modal dialog
            await contentWizard.clickOnRenameContentDialogButton(TEST_FOLDER.displayName);
            let actualName = await renameContentDialog.getNameInInput();
            assert.equal(actualName,  TEST_FOLDER.displayName, "Expected Name should be in the dialog");
        });

    it("GIVEN new path has been typed in the modal dialog WHEN 'Cancel' button has been clicked THEN path should not be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Click on 'open rename button' and open the modal dialog:
            let renameContentDialog = new RenameContentDialog();
            await contentWizard.clickOnRenameContentDialogButton(TEST_FOLDER.displayName);
            await renameContentDialog.waitForDialogLoaded();
            await renameContentDialog.typeInNewNameInput(NEW_NAME);
            // 2. Verify that 'Rename' button gets enabled:
            await renameContentDialog.waitForRenameButtonEnabled();
            await renameContentDialog.clickOnCloseButton();
            await renameContentDialog.waitForDialogClosed();
            let actualPath = await contentWizard.getNameInToolbar();
            assert.equal(actualPath, TEST_FOLDER.displayName, "Path in wizard page should not be updated");
        });

       // Verifies: Path field gets unlocked after a published content is modified #5073
    it("GIVEN new path has been typed in the modal dialog WHEN 'Rename' button has been clicked THEN path should be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Click on 'Modify path icon' and open the modal dialog:
            let renameContentDialog = new RenameContentDialog();
            await contentWizard.clickOnRenameContentDialogButton(TEST_FOLDER.displayName);
            await renameContentDialog.typeInNewNameInput(NEW_NAME);
            // 2. Verify that 'Rename' button gets enabled:
            await renameContentDialog.waitForRenameButtonEnabled();
            await renameContentDialog.clickOnRenameButton();
            let message = await contentWizard.waitForNotificationMessage();
            let actualPath = await contentWizard.getNameInToolbar();
            assert.equal(actualPath, NEW_NAME, 'Path in wizard page should be updated');
            // 4. Verify that content's status gets 'Moved'
            const contentSection = new DetailsWidgetContentSection();
            const workflow = await contentSection.getStatusText();
            assert.equal(workflow, appConst.CONTENT_STATUS.ONLINE_MOVED, 'Online moved status should be displayed');
            // 5. Verify that expected notification message:
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.CONTENT_RENAMED, "'Content has been renamed' - this message should be displayed");
        });

    it("GIVEN 'moved' content has been opened WHEN the content has been unpublished THEN 'modify the path' icon should not be visible in the wizard-page",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. open existing 'Moved' folder:
            await studioUtils.selectByDisplayNameAndOpenContent(TEST_FOLDER.displayName);
            // 2. Do unpublish the folder:
            await studioUtils.doUnPublishInWizard();
            // 'Page Editor' is opened by default:
            await studioUtils.saveScreenshot('unpublished_content_modify_path_icon');
            //3. Verify that span with 'Click to rename the content' is not displayed for the unpublished content:
            //await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.UNPUBLISHED);
        });

    it("GIVEN 'Rename published content' dialog is opened WHEN the path of existing content has been typed THEN 'Unavailable' message should appear in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectByDisplayNameAndOpenContent(TEST_FOLDER.displayName);
            await contentWizard.pause(500);
            // 1. Click on the locked 'path input' and open the modal dialog:
            let renameContentDialog = new RenameContentDialog();
            await contentWizard.clickOnRenameContentDialogButton(NEW_NAME);
            // 2. Type the path of existing content:
            await renameContentDialog.typeInNewNameInput(NOT_AVAILABLE_PATH);
            // 3. Verify that 'Rename' button gets disabled:
            await renameContentDialog.waitForRenameButtonDisabled();
            // 4. Verify that validation message is displayed:
            await renameContentDialog.waitForNameAvailabilityStatus('Unavailable');
        });

    it.skip("GIVEN renamed folder has been opened THEN 'Renamed' version item should be visible in the published content",
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
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
