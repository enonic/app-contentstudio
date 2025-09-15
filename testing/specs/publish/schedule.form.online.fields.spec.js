/**
 * Created on 31.07.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const DateTimePickerPopup = require('../../page_objects/wizardpanel/time/date.time.picker.popup');
const DateRangeInput = require('../../page_objects/components/datetime.range');
const ScheduleWidgetItem = require('../../page_objects/browsepanel/detailspanel/schedule.widget.itemview');
const EditScheduleDialog = require('../../page_objects/details_panel/edit.schedule.dialog');

describe(`schedule.form.online.fields.spec:  tests for schedule form and Edit Schedule forms`, function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let TEST_FOLDER;

    // Test for the Schedule form #8940
    // https://github.com/enonic/app-contentstudio/issues/8940
    it(`GIVEN Schedule form is loaded WHEN 'From' field is empty BUT 'TO' field is filled in THEN 'Details' widget Online from/to dates are set correctly`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let scheduleWidgetItem = new ScheduleWidgetItem();
            let dateRangeInput = new DateRangeInput();
            // 1. Add a ready for publishing folder:
            let displayName = appConst.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 2. Open Publish modal dialog:
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'Add Schedule' icon in the Publish dialog:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 4. Click and show Picker popup for 'Online to' field:
            await contentPublishDialog.showOnlineToPickerPopup();
            // 5. Click on Prev icon in Online To Data Picker and set the current date and 23 hours:
            await dateTimePickerPopup.clickOnHoursArrowDown();
            await dateRangeInput.pause(1000);
            await studioUtils.saveScreenshot('schedule_online_to_picker_23_hours');
            // 6. Click on OK button in Picker and set the date for the "To" field:
            await dateTimePickerPopup.clickOnOkButton();
            // 7. Click on Schedule button in Publish dialog, and close it
            await contentPublishDialog.clickOnScheduleButton();
            // 8. Verify the 'Online TO' date in Schedule Widget:
            await contentWizard.openContextWindow();
            await studioUtils.saveScreenshot('wizard_schedule_widget_item');
            await wizardContextPanel.waitForScheduleWidgetItemDisplayed();
            let actualOnlineToDate = await scheduleWidgetItem.getOnlineToDateTime();
            let currentDate = new Date().toISOString().substring(0, 10);
            // 9. Verify that the 'Online to' date is set correctly:
            assert.ok(actualOnlineToDate.includes(currentDate), `Expected date should be displayed in the 'Online to' field `);
            assert.ok(actualOnlineToDate.includes('23:00'), `Expected hours should be displayed in the 'Online to' field`);
            // 10. Verify that the current date/time has been set in 'Online from' field in the widget:
            let actualOnlineFromDate = await scheduleWidgetItem.getOnlineFromDateTime();
            assert.ok(actualOnlineFromDate.includes(currentDate), `Current date/time should be displayed in 'Online from' field`);
        });

    // Test for "Edit Schedule" dialog #8941
    it(`GIVEN Edit Schedule has been clicked WHEN remove 'Online From' and change 'Online To' THEN Verify that 'Online From' is set to current date/time, and Online To to the value set in the dialog.`,
        async () => {
            let contentWizard = new ContentWizard();
            let editScheduleDialog = new EditScheduleDialog();
            let wizardContextPanel = new WizardContextPanel();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let scheduleWidgetItem = new ScheduleWidgetItem();
            let dateRangeInput = new DateRangeInput();
            // 1. Add the published folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openContextWindow();
            // 2. 'Edit Schedule' has been clicked
            await scheduleWidgetItem.clickOnEditScheduleButton();
            await editScheduleDialog.waitForLoaded();
            // 4. Click and 'show Picker' popup for 'Online to' field:
            await editScheduleDialog.showOnlineToPickerPopup();
            // 5. Click on Prev icon in Online To Data Picker and set the current date and 22 hours:
            await dateTimePickerPopup.clickOnHoursArrowDown();
            await dateRangeInput.pause(1000);
            await studioUtils.saveScreenshot('edit_schedule_22_hours');
            await editScheduleDialog.typeOnlineFrom(''); // Clear the 'Online from' field
            let onlineFromCleared = await editScheduleDialog.getOnlineFrom();
            assert.ok(onlineFromCleared == '', `Online From field should be empty after clearing it`);
            // 6. Click on Apply button in Picker and set the date for the "To" field:
            await editScheduleDialog.clickOnApplyButton();
            await editScheduleDialog.waitForClosed();
            await studioUtils.saveScreenshot('wizard_schedule_widget_item_updated');
            // 7.  Verify that 'Online From' is set to current date/time
            let actualOnlineToDateTime = await scheduleWidgetItem.getOnlineToDateTime();
            let currentDateString = new Date().toISOString().substring(0, 10);
            assert.ok(actualOnlineToDateTime.includes(currentDateString), `Expected date should be displayed in the 'Online to' field `);
            assert.ok(actualOnlineToDateTime.includes('22:00'), `Expected hours should be displayed in the 'Online to' field`);

            let currentDateTime = new Date();
            let currentHours = currentDateTime.getHours();
            // 8. 'Online To' to the value set in the dialog.
            let actualOnlineFromDateTime = await scheduleWidgetItem.getOnlineFromDateTime();
            assert.ok(actualOnlineFromDateTime.includes(currentDateString), `Current date should be displayed in the 'Online from' field `);
            let date = new Date(actualOnlineFromDateTime);
            let actualHours = date.getHours();
            assert.strictEqual(currentHours, actualHours, `Expected and actual hours should be equal in 'Online from' field`);
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
