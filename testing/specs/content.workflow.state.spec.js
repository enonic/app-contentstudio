/**
 * Created on 25.07.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../libs/app_const');

describe('content.workflow.state.spec: creates a folder and changes and checks the workflow state of this content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
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
            let state = await contentBrowsePanel.getWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS, "'Work in progress' icon should be displayed in browse panel");
        });

    it(`WHEN new folder has been opened THEN 'Work in progress' state should be displayed in the wizard`,
        async () => {
            let wizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            let state = await wizard.getToolbarWorkflowState();
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS, "'Work in progress' icon should be displayed in wizard");
        });

    it(`GIVEN new folder has been opened WHEN the folder has been marked as ready THEN 'Ready for publishing' state should be displayed in the wizard`,
        async () => {
            let wizard = new ContentWizard();
            //1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Click on 'MARK AS READY' default action:
            await wizard.clickOnMarkAsReadyButton();
            let message = await wizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("marked_as_ready_workflow_state");
            assert.equal(message, appConstant.markedAsReadyMessage(TEST_FOLDER.displayName),
                "Message: 'Item is marked as ready' should appear");
            let state = await wizard.getToolbarWorkflowState();
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "'Ready for publishing' icon should be displayed in the wizard");
        });

    it(`WHEN ready for publishing folder is selected THEN green circle should be displayed in the row with the folder`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let state = await contentBrowsePanel.getWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "'Ready for publishing' icon should be displayed in browse panel");
        });

    it(`GIVEN ready for publishing folder is selected WHEN previous version has been restored THEN 'Work in progress' state gets visible in wizard`,
        async () => {
            let versionPanel = new WizardVersionsWidget();
            let wizard = new ContentWizard();
            //1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Revert the previous version:
            await wizard.openVersionsHistoryPanel();
            await versionPanel.clickAndExpandVersion(1);
            await versionPanel.clickOnRevertButton();
            studioUtils.saveScreenshot("revert_workflow_state");
            //State in wizard gets 'Work in Progress':
            let state = await wizard.getToolbarWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS,
                "'Work in progress' -state should appear after reverting the previous version");
        });
    //Verifies: Incorrect notification message after reverting a version that is identical to the current version #1656
    it(`GIVEN existing folder is opened WHEN identical to the current version has been reverted THEN 'No changes to revert.' message should appear`,
        async () => {
            let versionPanel = new WizardVersionsWidget();
            let wizard = new ContentWizard();
            //1. Open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Revert the identical version:
            await wizard.openVersionsHistoryPanel();
            await versionPanel.clickAndExpandVersion(2);
            await versionPanel.clickOnRevertButton();
            //3. Expected message should appear:
            studioUtils.saveScreenshot("revert_identical_version");
            let message = await wizard.waitForNotificationMessage();
            assert.equal(message, appConstant.NO_CHANGES_TO_REVERT_MESSAGE, "'No changes to revert.' this message should appear");
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
