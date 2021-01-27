/**
 * Created on 29.07.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ScheduleForm = require('../../page_objects/wizardpanel/schedule.wizard.step.form');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');

describe('wizard.publish.menu.workflow.spec - publishes and unpublishes single folder in wizard', function () {
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
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();

            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED);
            await contentWizard.waitForUnpublishButtonDisplayed();
        });

    it(`GIVEN existing 'published' folder is opened WHEN publish menu has been expanded THEN 'Request Publishing...' menu item should be disabled AND 'Create Task...' is enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //Click on dropdown handle and open Publish Menu:
            await contentWizard.openPublishMenu();
            studioUtils.saveScreenshot("publish_menu_items2");
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_TASK);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        });

    it(`GIVEN existing 'Published' folder is opened WHEN the folder has been updated THEN 'Modified' status AND MARK AS READY button get visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.typeDisplayName(NEW_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            let status = await contentWizard.getContentStatus();

            assert.equal(status, appConst.CONTENT_STATUS.MODIFIED);
            await contentWizard.waitForMarkAsReadyButtonVisible();

            let onlineFrom = await scheduleForm.getOnlineFrom();
            assert.isFalse(studioUtils.isStringEmpty(onlineFrom), "Online from input should not be empty");

            let workflow = await contentWizard.getToolbarWorkflowState();
            assert.equal(workflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });

    it(`GIVEN existing 'Modified' folder is opened WHEN publish menu has been expanded THEN 'Request Publishing...' menu item should be enabled AND 'Create Task...' is enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);

            //Click on dropdown handle and open Publish Menu:
            await contentWizard.openPublishMenu();
            studioUtils.saveScreenshot("publish_menu_items3");
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_TASK);
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        });

    it(`GIVEN existing 'modified' content is opened WHEN 'unpublish...' button has been pressed AND it confirmed in the modal dialog THEN 'UNPUBLISHED' status should appear in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //'MARK AS READY' button should be present on the toolbar
            //So need to open the publish-menu and select 'Unpublish...' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.UNPUBLISH);
            //open 'Unpublish Content' Dialog:
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await contentUnpublishDialog.waitForDialogOpened();
            await contentUnpublishDialog.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogClosed();
            //Status should be Unpublished and 'Mark as Ready' button should be visible
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.UNPUBLISHED);
            await contentWizard.waitForMarkAsReadyButtonVisible();
            //Schedule form gets not visible:
            await scheduleForm.waitForNotDisplayed();

            let workflow = await contentWizard.getToolbarWorkflowState();
            assert.equal(workflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });

    //verifies - https://github.com/enonic/app-contentstudio/issues/891 Workflow state should not be displayed for 'Deleted' content
    it(`GIVEN folder was modified and 'unpublished' then it has been published again WHEN 'Delete' button has been pressed and deleting confirmed THEN 'Deleted' status gets visible in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.clickOnMarkAsReadyButton();
            //GIVEN: folder is published
            await contentWizard.openPublishMenuAndPublish();
            //WHEN: the folder has been Marked as deleted:
            await contentWizard.doMarkAsDeleted();
            //THEN: Schedule form should be visible:
            await scheduleForm.waitForDisplayed();
            //Workflow state should not be displayed for the Deleted content
            await contentWizard.waitForStateIconNotDisplayed();
            //AND: Status should be 'Deleted'
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MARKED_FOR_DELETION);
            //AND: 'Publish...' button should be present on the toolbar:
            await contentWizard.waitForPublishButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
