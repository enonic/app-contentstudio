/**
 * Created on 15.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('wizard.mark.as.ready.spec - publishes and unpublishes single folder in wizard`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;

    // verifies https://github.com/enonic/app-contentstudio/issues/792
    //workflow state icons are not updated after the content has been marked as ready
    it(`GIVEN new folder-wizard, name has been typed WHEN 'MARK AS READY' button has been pressed THEN 'workflow-state' should be updated to Ready For Publishing`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1. Open existing folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            //2. Click on 'MARK AS READY' button
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.pause(1000);
            //3. Get 'workflow state' in toolbar in the wizard-page:
            let toolbarState = await contentWizard.getToolbarWorkflowState();
            studioUtils.saveScreenshot("wizard_workflow_state_1");
            assert.equal(toolbarState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //4. Check the icon:
            let iconState = await contentWizard.getIconWorkflowState();
            assert.equal(iconState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            await contentWizard.waitForPublishButtonDisplayed();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/792
    //workflow state icons are not updated after the content has been marked as ready
    it(`GIVEN new folder-wizard, name has been typed WHEN 'Mark as ready' button has been pressed THEN 'workflow-state' should be updated to Ready For Publishing`,
        async () => {
            let contentWizard = new ContentWizard();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            //2. Click on 'Mark as ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.pause(1500);

            //3. Workflow should be updated (ready for publishing now)
            let toolbarState = await contentWizard.getToolbarWorkflowState();
            studioUtils.saveScreenshot("wizard_workflow_state_2");
            assert.equal(toolbarState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);

            let iconState = await contentWizard.getIconWorkflowState();
            assert.equal(iconState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //Drop Down handle should be visible after closing the dialog!
            await contentWizard.waitForShowPublishMenuButtonVisible();
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/717, https://github.com/enonic/app-contentstudio/issues/792
    //Default action is not updated after creation of a new Publish Request
    it(`GIVEN new folder-wizard is opened, a name has been typed WHEN new 'Publish Request' has been created THEN default action gets OPEN REQUEST`,
        async () => {
            let contentWizard = new ContentWizard();
            let taskDetailsDialog = new TaskDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.clickOnMarkAsReadyButton(displayName);
            //2. Open Request Publishing dialog and create new request:
            await contentWizard.openPublishMenuAndCreateRequestPublish("my changes");

            //3. Verify taht 'Open Request' -  action gets default in the wizard's toolbar.
            await contentWizard.waitForOpenRequestButtonVisible();
            let toolbarState = await contentWizard.getToolbarWorkflowState();
            studioUtils.saveScreenshot("wizard_workflow_state_3");
            assert.equal(toolbarState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);

            let iconState = await contentWizard.getIconWorkflowState();
            assert.equal(iconState, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //Drop Down handle should be visible after closing the dialog!
            await contentWizard.waitForShowPublishMenuButtonVisible();
        });

    //verifies - https://github.com/enonic/app-contentstudio/issues/891 Workflow state should not be displayed for Deleted content
    //verifies https://github.com/enonic/app-contentstudio/issues/692   'Publish...' should be the default action for content in Deleted state
    it(`GIVEN existing folder (Ready for publishing)is opened ADN it has been published then modified WHEN this folder has been 'Deleted' THEN default action gets PUBLISH...`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let settingsForm = new SettingsStepForm();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //folder has been published
            await contentWizard.openPublishMenuAndPublish();
            await settingsForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.waitAndClickOnSave();
            //WHEN: the folder has been marked as deleted:
            await contentWizard.doMarkAsDeleted();
            await contentWizard.doSwitchToContentBrowsePanel();

            //Workflow state icon should not be displayed!
            await contentBrowsePanel.waitForStateIconNotDisplayed(TEST_FOLDER.displayName);
            //AND: 'Publish...' should be default on the browse-toolbar:
            await contentBrowsePanel.waitForPublishButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
