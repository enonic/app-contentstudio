/**
 * Created on 13.11.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('wizard.publish.dialog.mark.as.ready.spec - reopen Publishing Wizard after marking the content as ready in the dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    // Verifies: Publishing Wizard shows 'In progress' after the content was marked as ready in the dialog
    it(`GIVEN new folder is saved AND marked as ready in Publishing Wizard AND the dialog is closed WHEN 'Publish' button has been pressed THEN the folder should be 'Ready for publishing' in the reopened dialog`, async () => {
        let contentWizard = new ContentWizard();
        let contentPublishDialog = new ContentPublishDialog();
        let name = contentBuilder.generateRandomName('folder');
        let folder = contentBuilder.buildFolder(name);
        // 1. Open new folder-wizard, type the name and save the folder:
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizard.typeData(folder);
        await contentWizard.waitAndClickOnSave();
        await contentWizard.waitForNotificationMessage();
        // 2. Click on 'Publish...' menu item in the wizard:
        await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
        await contentPublishDialog.waitForDialogOpened();
        // 3. The folder is 'In progress', so 'Publish now' button should be disabled:
        await contentPublishDialog.waitForPublishNowButtonDisabled();
        // 4. Click on 'Mark as ready' button in the modal dialog:
        await contentPublishDialog.clickOnMarkAsReadyButton();
        // 5. Verify that the folder gets 'Ready for publishing':
        await contentPublishDialog.waitForReadyForPublishingTextDisplayed();
        await contentPublishDialog.waitForPublishNowButtonEnabled();
        await studioUtils.saveScreenshot('wizard_publish_dialog_marked_as_ready');
        await contentPublishDialog.waitForWorkflowIconState(name, 'ready');
        // 6. Close the modal dialog without publishing:
        await contentPublishDialog.clickOnCloseButton();
        await contentPublishDialog.waitForDialogClosed();
        // 7. 'Publish...' button gets default action in the wizard, click on it and reopen the dialog:
        await contentWizard.clickOnPublishButton();
        // 8. Verify that the folder remains 'Ready for publishing' in the reopened dialog:
        await studioUtils.saveScreenshot('wizard_publish_dialog_reopened_ready');
        await contentPublishDialog.waitForReadyForPublishingTextDisplayed();
        await contentPublishDialog.waitForMarkAsReadyButtonNotDisplayed();
        await contentPublishDialog.waitForPublishNowButtonEnabled();
        await contentPublishDialog.waitForWorkflowIconState(name, 'ready');
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(async () => {
        await studioUtils.doPressEscape();
        await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
