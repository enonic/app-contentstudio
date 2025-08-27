/**
 * Created on 25.07.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../libs/app_const');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');

describe('content.workflow.state.spec: creates a folder and changes and checks the workflow state of this content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;

    it(`WHEN 'New' folder has been selected in the grid THEN 'Work in progress' state should be displayed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let state = await contentBrowsePanel.getWorkflowStateByDisplayName(TEST_FOLDER.displayName);
            assert.equal(state, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS, "'Work in progress' icon should be displayed in browse panel");
        });

    it(`WHEN new folder has been opened THEN 'Work in progress' state should be displayed in the wizard`,
        async () => {
            let wizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            let state = await wizard.getContentWorkflowState();
            assert.equal(state, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS, `'Work in progress' icon should be displayed`);
        });

    it(`GIVEN new folder has been opened WHEN the folder has been marked as ready THEN 'Ready for publishing' state should be displayed in the wizard`,
        async () => {
            let wizard = new ContentWizard();
            // 1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 2. Click on 'MARK AS READY' default action:
            await wizard.clickOnMarkAsReadyButton();
            let message = await wizard.waitForNotificationMessage();
            let contentPublishDialog = new ContentPublishDialog();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await studioUtils.saveScreenshot('marked_as_ready_workflow_state');
            assert.equal(message, appConst.markedAsReadyMessage(TEST_FOLDER.displayName),
                "Message: 'Item is marked as ready' should appear");
            let state = await wizard.getContentWorkflowState();
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "'Ready for publishing' icon should be displayed in the wizard");
        });

    it(`WHEN ready for publishing folder is selected THEN green circle should be displayed in the row with the folder`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let state = await contentBrowsePanel.getWorkflowStateByDisplayName(TEST_FOLDER.displayName);
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                `'Ready for publishing' icon should be displayed in browse panel`);
        });

    it(`GIVEN ready for publishing folder is selected WHEN previous version has been restored THEN 'Work in progress' state gets visible in wizard`,
        async () => {
            let versionPanel = new WizardVersionsWidget();
            let wizard = new ContentWizard();
            // 1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 2. Revert the previous version:
            await wizard.openVersionsHistoryPanel();
            await versionPanel.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED,1);
            await versionPanel.clickOnRevertButton();
            await studioUtils.saveScreenshot('revert_workflow_state');
            // State in wizard gets 'Work in Progress':
            let state = await wizard.getContentWorkflowState();
            assert.equal(state, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS,
                `'Work in progress' -state should appear after reverting the previous version`);
        });
    // Verifies: Incorrect notification message after reverting a version that is identical to the current version #1656
    it(`GIVEN existing folder is opened WHEN identical to the current version has been reverted THEN 'No changes to revert.' message should appear`,
        async () => {
            let versionPanel = new WizardVersionsWidget();
            let wizard = new ContentWizard();
            // 1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 2. Revert the identical version:
            await wizard.openVersionsHistoryPanel();
            await versionPanel.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED,2);
            await versionPanel.clickOnRevertButton();
            // 3. Expected message should appear:
            await studioUtils.saveScreenshot('revert_identical_version');
            let message = await wizard.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.NO_CHANGES_TO_REVERT_MESSAGE, "'No changes to revert.' this message should appear");
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
