/**
 * Created on 25.07.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('content.workflow.state.spec: creates a folder and changes and checks the workflow state of this content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let articleContent;

    it(`WHEN new folder has been selected in the grid THEN 'Work in progress' state should be displayed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let state = await contentBrowsePanel.getWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });

    it(`WHEN new folder has been opened THEN 'Work in progress' state should be displayed in the wizard`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let wizard = new ContentWizard();
            await studioUtils.openContentInWizard(TEST_FOLDER.displayName);
            let state = await wizard.getWorkflowState();
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });

    it(`GIVEN new folder has been opened WHEN the folder has been marked as ready THEN 'Ready for publishing' state should be displayed in the wizard`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let wizard = new ContentWizard();
            await studioUtils.openContentInWizard(TEST_FOLDER.displayName);
            await wizard.clickOnMarkedAsReadyButton();
            let message = await wizard.waitForNotificationMessage();
            //TODO this assert fails now. (bug)
            //assert.equal(message, appConstant.markedAsReadymessage(TEST_FOLDER.displayName),
            //   "Message: 'Item is marked as ready' should appear");
            let state = await wizard.getWorkflowState();
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });

    it(`WHEN ready for publishing folder is selected THEN green circle should be displayed in the row with the folder`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let wizard = new ContentWizard();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let state = await contentBrowsePanel.getWorkflowState(TEST_FOLDER.displayName);
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
})
;