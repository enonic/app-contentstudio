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
const PublishContentDialog = require('../../page_objects/content.publish.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('wizard.publish.menu.workflow.spec - publishes and unpublishes single folder in wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let NEW_DISPLAY_NAME = "new display name 1";

    it(`GIVEN name input is filled in WHEN display name input is empty THEN only 'Create Task' menu item shoule be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Fill in the name(path) input
            await contentWizard.typeInPathInput(appConst.generateRandomName("folder"));
            //3. Save the content with empty displayName:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //4. Click on dropdown handle and verify the menu items:
            await contentWizard.openPublishMenu();
            await studioUtils.saveScreenshot("publish_menu_items2");
            //Only Create Task menu item should be enabled
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_TASK);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.UNPUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
            //5. The content should be invalid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "The content should be invalid");
        });

    it(`GIVEN 'Marked as Ready' folder is opened WHEN 'Publish...' button has been pressed AND the folder has been published THEN 'UNPUBLISH' button gets visible on the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Publish the folder:
            await contentWizard.doPublish();
            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED);
            //2. Verify that Unpublish is default action now
            await contentWizard.waitForUnpublishButtonDisplayed();
        });

    it(`WHEN existing 'published' folder is opened THEN 'Online from' and 'Online to' appear in the Schedule step form`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            //1. Open the published folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.waitForWizardStepPresent("Schedule");
            //2. Verify that actual dateTime is correct in Online From input
            let fromActual = await scheduleForm.getOnlineFrom();
            let expectedDate = new Date().toISOString().substring(0, 10);
            assert.isTrue(fromActual.includes(expectedDate), "Expected date time should be displayed");
            //3. Verify that 'Online to' input is empty
            let to = await scheduleForm.getOnlineTo();
            assert.equal(to, "", "Online to should be empty");
        });

    it(`GIVEN existing 'published' folder is opened WHEN publish menu has been expanded THEN 'Request Publishing...' menu item should be disabled AND 'Create Task...' is enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open the 'published' folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Click on dropdown handle and open Publish Menu:
            await contentWizard.openPublishMenu();
            await studioUtils.saveScreenshot("publish_menu_items2");
            //3. Verify that just only 2 menu items are enabled
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_TASK);
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.UNPUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
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
            //1. Open the existing folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.clickOnMarkAsReadyButton();
            //2. Publish the folder
            await contentWizard.openPublishMenuAndPublish();
            //3. Click on Mark as Deleted menu item:
            await contentWizard.doMarkAsDeleted();
            //4. Verify that Schedule form should be visible:
            await scheduleForm.waitForDisplayed();
            //5. Verify: Workflow state should not be displayed for the Deleted content
            await contentWizard.waitForStateIconNotDisplayed();
            //6. Verify: Status should be 'Deleted'
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MARKED_FOR_DELETION);
            //AND: 'Publish...' button should be present on the toolbar:
            await contentWizard.waitForPublishButtonDisplayed();
        });

    it("GIVEN existing folder has been marked as deleted in the wizard WHEN the folder has been 'published' THEN wizard closes AND the content should not be listed in the grid",
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let folderName = appConst.generateRandomName('folder');
            //1. Open new folder wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(folderName);
            //2. publish this folder
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.openPublishMenuAndPublish();
            //3. Click on Mark as Deleted menu item:
            await contentWizard.doMarkAsDeleted();
            //4. Publish the MARKED FOR DELETION content
            await contentWizard.clickOnPublishButton();
            let publishContentDialog = new PublishContentDialog();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.clickOnPublishNowButton();
            await studioUtils.doSwitchToContentBrowsePanel();
            //5. Verify that the wizard closes abd the folder is deleted:
            await studioUtils.typeNameInFilterPanel(folderName);
            await contentBrowsePanel.waitForContentNotDisplayed(folderName);
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
