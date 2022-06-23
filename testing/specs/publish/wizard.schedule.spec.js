/**
 * Created on 22.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ScheduleForm = require('../../page_objects/wizardpanel/schedule.wizard.step.form');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('Wizard page - verify schedule form', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SCHEDULE_STEP_TITLE = 'Schedule';
    const DATE_TIME_IN_PAST = "2020-09-10 00:00";
    const DATE_TIME_IN_FUTURE = "2029-09-10 00:00";
    let TEST_FOLDER;

    it(`WHEN new folder has been created THEN schedule form should not be present AND schedule menu item is not visible on the step-navigator`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1. Open new folder-wizard, type a name and save:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(TEST_FOLDER.displayName);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.clickOnMarkAsReadyButton();
            //2. Schedule button should not be displayed in the step-navigator:
            let result = await contentWizard.isWizardStepByTitlePresent(SCHEDULE_STEP_TITLE);
            assert.isFalse(result, "Schedule button should no be visible");
            //3. 'Schedule form' should not be present in the wizard page:
            result = await contentWizard.waitForScheduleFormVisible();
            assert.isFalse(result, "Schedule form should no be visible");
            let status = await contentWizard.getContentStatus();
            assert.equal(status, "New", "New status should be in ContentWizardToolbar");
        });

    it(`GIVEN existing content is opened WHEN content has been published THEN 'Schedule' form should appear AND folder ges PUBLISHED`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Select and publish the content:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openPublishMenuAndPublish();
            //2. Schedule item appears in WizardStepNavigatorAndToolbar
            let result = await contentWizard.isWizardStepByTitlePresent(SCHEDULE_STEP_TITLE);
            assert.isTrue(result, "'Schedule' button gets visible in the step-navigator");
            result = await contentWizard.waitForScheduleFormVisible();
            assert.isTrue(result, "Schedule form should appear in the wizard page");
            studioUtils.saveScreenshot("check_schedule_form");
            //3. Published status should be displayed in the wizard toolbar
            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'Published', "'Published' status should be displayed in the toolbar");
        });

    it(`WHEN existing published content is opened THEN Expected date time should be displayed in 'Online from'`,
        async () => {
            let scheduleForm = new ScheduleForm();
            let expectedDate = new Date().toISOString().substring(0, 10);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            let from = await scheduleForm.getOnlineFrom();
            assert.isTrue(from.includes(expectedDate), "Expected date time should be displayed");
        });

    it("GIVEN existing published folder is opened WHEN 'Online to' is earlier than 'Online from' THEN expected validation message appears",
        async () => {
            let scheduleForm = new ScheduleForm();
            //1. Open the 'published' folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await scheduleForm.typeOnlineTo(DATE_TIME_IN_PAST);
            await studioUtils.saveScreenshot("online_to_in_past");
            await scheduleForm.waitForValidationRecording();
            let recordingActual = await scheduleForm.getValidationRecord();
            assert.equal(recordingActual, appConst.VALIDATION_MESSAGE.SCHEDULE_FORM_ONLINE_PAST);
        });

    it("GIVEN existing published folder is opened WHEN 'Online from' has been cleared and 'Online to' has been set THEN expected notification message appears",
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            //1. Open the 'published' folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. 'Online from' has been cleared and 'Online to' has been set in future
            await scheduleForm.typeOnlineFrom('  ');
            await scheduleForm.typeOnlineTo(DATE_TIME_IN_FUTURE);
            //3. Click on Save button
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot("online_to_cleared");
            //4. Verify that expected validation recording is displayed:
            await scheduleForm.waitForValidationRecording();
            let recordingActual = await scheduleForm.getValidationRecord();
            assert.equal(recordingActual, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED);
            //5. Verify that expected notification message appears:
            let message = await contentWizard.waitForNotificationMessage();
            assert.equal(message, "[Online to] date/time cannot be set without [Online from]");
        });

    it(`GIVEN existing published content is opened WHEN content has been unpublished THEN 'Schedule' form gets not visible`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Select and open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Unpublish the folder:
            await studioUtils.doUnPublishInWizard();
            //3. Verify the toolbar and status:
            let result = await contentWizard.waitForWizardStepByTitleNotVisible(SCHEDULE_STEP_TITLE);
            assert.isTrue(result, "Schedule menu item gets not visible in the step-navigator");
            //4. 'Schedule' item gets  not visible in WizardStepNavigatorAndToolbar
            await contentWizard.waitForScheduleFormNotVisible();
            await studioUtils.saveScreenshot("check_schedule_form_unpublished");
            //5. 'Unpublished' status should be displayed in the toolbar:
            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'Unpublished', "'Unpublished' status should be displayed in the toolbar");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/941
    //Incorrect status in version history for content with scheduled publishing #941
    it("WHEN 'Online from' has been set in the future AND Publish button pressed THEN folder gets 'Publishing Scheduling'",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            //1. Select and open the unpublished folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Expand the publish menu then click on 'Publish...'
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            //3. Click on Add Schedule (calendar icon):
            await contentPublishDialog.clickOnAddScheduleIcon();
            //4. Type dateTime in future
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_FUTURE);
            //5. Press the Schedule button
            await contentPublishDialog.clickOnScheduleButton();
            //6. Verify that status is ''Publishing Scheduled''
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED);
            //7. Open  'Versions Panel':
            await contentWizard.openVersionsHistoryPanel();
            //8. Verify the status in versions widget
            let status = await wizardVersionsWidget.getContentStatus();
            assert.isTrue(status.includes("Will be published"), "Will be published should be present in the versions widget");
            assert.isTrue(status.includes(DATE_TIME_IN_FUTURE), "Expected date time in future should be displayed");
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
