/**
 * Created on 15.08.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('wizard.mark.as.ready.spec - publishes and unpublishes single folder in wizard`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;

    // verifies https://github.com/enonic/app-contentstudio/issues/792
    // workflow state icons are not updated after the content has been marked as ready
    it(`GIVEN new folder-wizard, name has been typed WHEN 'MARK AS READY' button has been pressed THEN 'workflow-state' should be updated to Ready For Publishing`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Open existing folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            // 2. Click on 'MARK AS READY' button
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.pause(1000);
            // 3. Get 'workflow state' in content-icon in the wizard-page:
            let iconState = await contentWizard.getContentWorkflowState();
            assert.equal(iconState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING, "The content should be 'Ready for publishing'");
            await contentWizard.waitForPublishButtonDisplayed();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/792
    // workflow state icons are not updated after the content has been marked as ready
    it(`GIVEN new folder-wizard, name has been typed WHEN 'Mark as ready' button has been pressed THEN 'workflow-state' should be updated to Ready For Publishing`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            // 2. Click on 'Mark as ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.pause(1500);
            // 3. Verify the workflow state icon:
            await studioUtils.saveScreenshot("wizard_workflow_state_2");
            let iconState = await contentWizard.getContentWorkflowState();
            assert.equal(iconState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            // DropDown handle should be visible after closing the dialog!
            await contentWizard.waitForShowPublishMenuButtonVisible();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/717, https://github.com/enonic/app-contentstudio/issues/792
    // Default action is not updated after creation of a new Publish Request
    it(`GIVEN new folder-wizard is opened, a name has been typed WHEN new 'Publish Request' has been created THEN default action gets OPEN REQUEST`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.clickOnMarkAsReadyButton(displayName);
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 2. Open Request Publishing dialog and create new request:
            await contentWizard.openPublishMenuAndCreateRequestPublish("my changes");
            // 3. Verify that 'Open Request' -  action gets default in the wizard's toolbar.
            await contentWizard.waitForOpenRequestButtonVisible();
            await studioUtils.saveScreenshot('wizard_workflow_state_3');
            let iconState = await contentWizard.getContentWorkflowState();
            assert.equal(iconState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            // Drop-Down handle should be visible after closing the dialog!
            await contentWizard.waitForShowPublishMenuButtonVisible();
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
