/**
 * Created on 22.11.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const ScheduleWidgetItem = require('../../page_objects/browsepanel/detailspanel/schedule.widget.itemview');
const EditScheduleDialog = require('../../page_objects/details_panel/edit.schedule.dialog');

describe('Wizard page - verify schedule form', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DATE_TIME_IN_PAST = '2020-09-10 00:00';
    const DATE_TIME_IN_FUTURE = '2029-09-10 00:00';
    const DATE_TIME_TO = '2029-09-11 00:00';
    let TEST_FOLDER;

    it(`WHEN new folder has been created THEN schedule widget item should not be displayed in 'Details' widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let wizardContextPanel = new WizardContextPanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Open new folder-wizard, type a name and save:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(TEST_FOLDER.displayName);
            await contentWizard.waitAndClickOnSave();
            // 2. Click on Mark as Ready button
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            // 3. Open Page Editor with Preview Widget,
            await contentWizard.clickOnPageEditorToggler();
            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'New', "New status should be in ContentWizardToolbar");
            await studioUtils.saveScreenshot('schedule_widget_item_not_displayed');
            // 4. Schedule widget item should not be displayed in the Details widget
            await wizardContextPanel.waitForScheduleWidgetItemNotDisplayed();
        });

    it(`GIVEN the content has been published WHEN 'Edit Schedule' button has been clicked THEN the expected date/time should be displayed in the 'Online from' input`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let scheduleWidgetItem = new ScheduleWidgetItem();
            let editScheduleDialog = new EditScheduleDialog();
            // 1. Open then publish the content:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openPublishMenuAndPublish();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.openDetailsWidget();
            // 2. Open Page Editor with Preview Widget, Verify that status gets  Published
            await contentWizard.clickOnPageEditorToggler();
            // 3. Published status should be displayed in the wizard toolbar
            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'Published', "'Published' status should be displayed in the toolbar");
            await studioUtils.saveScreenshot('edit_prop_not_schedule');
            // 4. Schedule widget item appears in the details panel:
            await wizardContextPanel.waitForScheduleWidgetItemDisplayed();
            // 5. Click on 'Edit Schedule' button in the Schedule Widget Item
            await scheduleWidgetItem.clickOnEditScheduleButton();
            await editScheduleDialog.waitForLoaded();
            // 6. Verify the date in Online from input:
            let expectedDate = new Date().toISOString().substring(0, 10);
            let from = await editScheduleDialog.getOnlineFrom();
            assert.ok(from.includes(expectedDate), "Expected Online from date/time should be displayed");
        });

    it(`WHEN the published content is opened THEN the expected 'Online from' should be displayed in the 'Schedule Widget'`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let scheduleWidgetItem = new ScheduleWidgetItem();
            // 1. Open the folder and publish it:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Verify the 'Online from' date in Schedule Widget:
            await studioUtils.saveScreenshot('wizard_schedule_widget_item');
            await wizardContextPanel.waitForScheduleWidgetItemDisplayed();
            let actualFromDate = await scheduleWidgetItem.getOnlineFromDateTime();
            let expectedDate = new Date().toISOString().substring(0, 10);
            assert.ok(actualFromDate.includes(expectedDate), "Expected Online from date/time should be displayed");
        });

    it("GIVEN Edit schedule dialog has been opened WHEN 'Online to' is earlier than 'Online from' THEN expected validation message appears",
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleWidgetItem = new ScheduleWidgetItem();
            let editScheduleDialog = new EditScheduleDialog();
            // 1. Open the 'published' folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 3. Open Edit Properties modal dialog:
            await scheduleWidgetItem.clickOnEditScheduleButton();
            await editScheduleDialog.typeOnlineTo(DATE_TIME_IN_PAST);
            await studioUtils.saveScreenshot('online_to_in_past');
            await editScheduleDialog.waitForValidationRecording();
            let recordingActual = await editScheduleDialog.getScheduleValidationRecord();
            assert.equal(recordingActual, appConst.VALIDATION_MESSAGE.SCHEDULE_FORM_ONLINE_PAST);
        });

    it("GIVEN existing published folder is opened WHEN 'Online from' input has been cleared and 'Online to' has been set THEN 'Invalid value entered' message appears",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the 'published' folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Open Edit Schedule modal dialog:
            let editScheduleDialog = await studioUtils.openEditScheduleDialog();
            // 3. 'Online from' input has been cleared and 'Online to' has been set in future
            await editScheduleDialog.typeOnlineFrom('  ');
            await editScheduleDialog.typeOnlineTo(DATE_TIME_IN_FUTURE);
            await studioUtils.saveScreenshot('online_to_cleared');
            // 4. Verify that  Save button is disabled after updating date in Edit Properties dialog:
            await contentWizard.waitForSaveButtonDisabled();
            // 5. Verify that expected validation recording is displayed:
            await editScheduleDialog.waitForScheduleFormDisplayed();
            let recordingActual = await editScheduleDialog.getScheduleValidationRecord();
            assert.equal(recordingActual, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED);
        });

    it(`GIVEN existing published content is opened WHEN the content has been unpublished THEN 'Edit Schedule' button should not be displayed in the widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Select and open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. Unpublish the folder:
            await studioUtils.doUnPublishInWizard();
            await contentWizard.pause(500);
            await studioUtils.saveScreenshot('check_schedule_form_unpublished');
            // 3. Open Page Editor with Preview Widget
            await contentWizard.clickOnPageEditorToggler();
            // 4. 'Edit Schedule' widget item should not be displayed in Details Panel
            await wizardContextPanel.waitForScheduleWidgetItemNotDisplayed();
            // 5. 'Unpublished' status should be displayed in the toolbar:
            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'Unpublished', "'Unpublished' status should be displayed in the toolbar");
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/941
    // Incorrect status in version history for content with scheduled publishing #941
    it("WHEN 'Online from' has been set in the future AND Publish button pressed THEN folder gets 'Publishing Scheduling'",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Select and open the unpublished folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 3. Open Page Editor with Preview Widget
            await contentWizard.clickOnPageEditorToggler();
            // 3. Expand the publish-menu then click on 'Publish...' menu item:
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 4. Click on 'Add Schedule' (calendar icon):
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 5. Type a dateTime in future
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_FUTURE);
            await contentPublishDialog.typeInOnlineTo(DATE_TIME_TO);
            await studioUtils.saveScreenshot('online_to_set');
            await contentPublishDialog.clickOnOkInPickerPopup();
            // 6. Press the Schedule button
            await contentPublishDialog.clickOnScheduleButton();
            // 7. Verify that status is 'Publishing Scheduled''
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.PUBLISHING_SCHEDULED);
            // 8. Open  'Versions Panel':
            await contentWizard.openVersionsHistoryPanel();
            // 9. Verify the status in versions widget
            let status = await wizardVersionsWidget.getContentStatus();
            assert.ok(status.includes('Will be published'), "'Will be published' should be present in the versions widget");
            assert.ok(status.includes(DATE_TIME_IN_FUTURE), 'Expected date time in future should be displayed');
        });

    it(`WHEN 'Online from' has been set in future THEN 'Published until' should be displayed in versions widget`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Open new folder-wizard, type a name and save:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(TEST_FOLDER.displayName);
            await contentWizard.waitAndClickOnSave();
            // 2. Click on Mark as Ready button
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on Add Schedule (calendar icon):
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 4. Type a date-Time 'in past':
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_PAST);
            // 5. Insert dateTime in future:
            await contentPublishDialog.typeInOnlineTo(DATE_TIME_TO);
            await studioUtils.saveScreenshot('online_to_set_2');
            await contentPublishDialog.clickOnOkInPickerPopup();
            // 6. Press 'Schedule' button
            await contentPublishDialog.clickOnScheduleButton();
            // 7. Open Page Editor with Preview Widget, Verify that status gets  Publishing Scheduled
            await contentWizard.clickOnPageEditorToggler();
            // 8. Verify that status is 'Publishing Scheduled''
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.PUBLISHED);
            // 9. Open 'Versions Panel':
            await contentWizard.openVersionsHistoryPanel();
            // 10. Verify the status in versions widget
            let status = await wizardVersionsWidget.getContentStatus();
            assert.ok(status.includes('Published until'), "'Published until' should be present in the versions widget");
            assert.ok(status.includes(DATE_TIME_TO), 'Expected date time in future should be displayed');
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
