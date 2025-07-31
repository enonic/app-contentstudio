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

describe(`schedule.form.blank.from.field.spec:  tests for schedule form when the only 'Online to' is selected`, function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let TEST_FOLDER;

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
            await dateTimePickerPopup.clickOnHoursArrowPrevInOnlineTo();
            await dateRangeInput.pause(1000);
            await studioUtils.saveScreenshot('schedule_online_to_picker_23_hours');
            // 6. Click on OK button in Picker and set the date for the "To" field:
            await dateTimePickerPopup.clickOnOkButton();
            // 7. Click on Schedule button in Publish dialog, and close it
            await contentPublishDialog.clickOnScheduleButton();
            // 8. Verify the 'Online TO' date in Schedule Widget:
            await contentWizard.openDetailsPanel();
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

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
