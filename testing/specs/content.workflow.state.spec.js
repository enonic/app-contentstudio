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

describe('content.workflow.state.spec: creates a folder and changes and checks the workflow state of this content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
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
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS,"'Work in progress' icon should be displayed in wizard");
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
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING,"'Ready for publishing' icon should be displayed in the wizard");
        });

    it(`WHEN ready for publishing folder is selected THEN green circle should be displayed in the row with the folder`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let wizard = new ContentWizard();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let state = await contentBrowsePanel.getWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING,"'Ready for publishing' icon should be displayed in browse panel");
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
            studioUtils.saveScreenshot("rollback_workflow_state");
            //State in wizard gets 'Work in Progress':
            let state = await wizard.getToolbarWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS,
                "'Work in progress' -state should appear after rollback the previous version");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});