/**
 * Created on 29.07.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ScheduleForm = require('../../page_objects/wizardpanel/schedule.wizard.step.form');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');

describe('wizard.publish.menu.spec - publishes and unpublishes single folder in wizard`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let NEW_DISPLAY_NAME = "new display name 1";


    it(`GIVEN 'Marked as Ready' folder is opened WHEN 'Publish...' button has been pressed AND the folder has been published THEN 'UNPUBLISH' button gets visible on the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.openContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();

            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED);
            await contentWizard.waitForUnpublishButtonDisplayed();
        });


    it(`GIVEN existing 'Published' folder is opened WHEN the folder has been updated THEN 'Modified' status AND MARK AS READY button get visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            await studioUtils.openContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.typeDisplayName(NEW_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            let status = await contentWizard.getContentStatus();

            assert.equal(status, appConst.CONTENT_STATUS.MODIFIED);
            await contentWizard.waitForMarkAsReadyButtonVisible();

            let onlineFrom = await scheduleForm.getOnlineFrom();
            assert.isFalse(studioUtils.isStringEmpty(onlineFrom), "Online from input should not be empty");

            let workflow = await contentWizard.getWorkflowState();
            assert.equal(workflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);

        });

    it(`GIVEN existing 'modified' content is opened WHEN 'unpublish' button has been pressed AND it confirmed in the modal dialog THEN 'UNPUBLISHED' status should appear in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            await studioUtils.openContentInWizard(TEST_FOLDER.displayName);
            //'MARK AS READY' button should be present on the toolbar
            //So need to open the publish-menu and select 'Unpublish' menu item
            await contentWizard.openPublishMenuSelectItem("Unpublish");

            //open 'Unpublish Content' Dialog:
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await contentUnpublishDialog.waitForDialogOpened();
            await contentUnpublishDialog.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogClosed();
            //Status should be Unpublished and 'Mark as Ready' button should be visible
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.UNPUBLISHED);
            await contentWizard.waitForMarkAsReadyButtonVisible();

            //Schedule form gets not visible
            await scheduleForm.waitForNotDisplayed();

            let workflow = await contentWizard.getWorkflowState();
            assert.equal(workflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });


    it(`GIVEN folder was modified and 'unpublished' then it has been published again WHEN 'Delete' button has been pressed and deleting confirmed THEN 'Deleted' status gets visible in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let deleteContentDialog = new DeleteContentDialog();
            let scheduleForm = new ScheduleForm();
            await studioUtils.openContentInWizard(TEST_FOLDER.displayName);
            //GIVEN: folder is published
            await contentWizard.openPublishMenuAndPublish();
            //WHEN: the folder has been deleted:
            await contentWizard.clickOnDelete();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnDeleteButton();
            //THEN: Schedule form should be visible:
            await scheduleForm.waitForDisplayed();

            let workflow = await contentWizard.getWorkflowState();
            assert.equal(workflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);

            //AND: Status should be 'Deleted'
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.DELETED);
            //AND: 'Publish...' button should be present on the toolbar:
            await contentWizard.waitForPublishButtonVisible();

        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
