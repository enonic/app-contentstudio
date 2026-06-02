/**
 * Created on 05.08.2019.  updated on 02.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const DateRangeInput = require('../../page_objects/components/datetime.range');
const DateTimePickerPopup = require('../../page_objects/wizardpanel/time/date.time.picker.popup');

describe('refresh.publish.dialog.spec - opens publish content modal dialog and checks control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const DEFAULT_TIME_POPUP = '16:00';
    const DATE_TIME_IN_PAST = '2022-01-10 00:00';

    it(`GIVEN 'Ready for publishing' folder is selected AND Publish dialog has been opened WHEN a language has been selected for the folder THEN the workflow-status should be work in progress`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let folderName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(folderName);
            // 1. New folder has been added:(status of this folder is Ready for publishing)
            await studioUtils.doAddReadyFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. 'Publish' button should  be  the default option in the menu, so click on it:
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            // 3. click on the folder-name in the modal dialog then switch to the wizard-tab:
            await contentPublishDialog.clickOnMainItemAndSwitchToWizard(FOLDER.displayName);
            // 4. Select a language in the wizard. The folder gets 'Work in Progress'
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            await contentWizard.pause(1000);
            // 5. close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            // 6. Switch to the Browse Panel  - Publish Modal Dialog is still opened:
            let workflowStatus = await contentPublishDialog.getWorkflowIconState(FOLDER.displayName);
            assert.equal(workflowStatus, 'in-progress', "Workflow status should be 'in-progress' in the modal dialog");
            await contentPublishDialog.waitForScheduleButtonDisabled();
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            // 7. 'Add Schedule' button  should be displayed, because the content is `Ready for publishing`
            await contentPublishDialog.waitForScheduleButtonEnabled();
        });

    it(`GIVEN schedule form has been added WHEN 'Online to' in past has been inserted THEN expected validation message should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let dateRangeInput = new DateRangeInput();
            // 1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Verify that icon-calendar gets visible now. Click on this icon:
            await contentPublishDialog.clickOnAddScheduleButton();
            await contentPublishDialog.typeInOnlineTo(DATE_TIME_IN_PAST);
            await contentPublishDialog.waitForOnlineToScheduleValidationMessageDisplayed();
            let actualMsg = await contentPublishDialog.getOnlineToScheduleValidationRecord();
            assert.strictEqual(actualMsg, appConst.VALIDATION_MESSAGE.SCHEDULE_FORM_ONLINE_PAST,
                'Expected validation message should appear');
        });

    it(`WHEN click on a day in 'Next month' (set the date in the future) icon in 'Online to' THEN validation message should not be displayed in the modal dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let dateRangeInput = new DateRangeInput();
            // 1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on this icon 'Schedule' button:
            await contentPublishDialog.clickOnAddScheduleButton();
            // 3. Open 'Online To' date time picker popup:
            await contentPublishDialog.showOnlineToPickerPopup();
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_1');
            // Click on  'arrow up' in hours in the Online To Picker popup:
            await dateTimePickerPopup.clickOnNextMonthButton();
            await dateTimePickerPopup.clickOnDayInCalendar(10);
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_2');
            await dateTimePickerPopup.clickOnOkButton();
            // 5. Online to is in the future, so validation message should not be displayed:
            await contentPublishDialog.waitForOnlineToScheduleValidationMessageNotDisplayed();
        });

    it(`WHEN click on a day 'Prev month' icon in 'Online to'(set time in the past) THEN validation message should be displayed in the modal dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let dateRangeInput = new DateRangeInput();
            // 1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on this icon Add Schedule calendar icon:
            await contentPublishDialog.clickOnAddScheduleButton();
            // 3. Open 'Online To' date time picker popup:
            await contentPublishDialog.showOnlineToPickerPopup();
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_1');
            // 4. Click on  'arrow up' in hours in the Online To Picker popup:
            await dateTimePickerPopup.clickOnPrevMonthButton();
            await dateTimePickerPopup.clickOnDayInCalendar(10);
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_2');
            await dateRangeInput.pause(100);
            await dateTimePickerPopup.clickOnOkButton();
            // 6. Online to is in the past, so validation message should  be displayed:
            await contentPublishDialog.waitForOnlineToScheduleValidationMessageDisplayed();
            let message = await contentPublishDialog.getOnlineToScheduleValidationRecord();
            assert.equal(message, appConst.VALIDATION_MESSAGE.SCHEDULE_FORM_ONLINE_PAST,
                'Expected message - Online to cannot be in the past');
        });

    it(`GIVEN schedule form has been added in Publish Wizard modal dialog WHEN DatePicker popup has been opened THEN the 'online from' time is set to '12:00' by default`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleButton();
            // 3. Open Oline from Picker popup:
            await contentPublishDialog.showOnlineFormPickerPopup();
            await dateTimePickerPopup.clickOnOkButton();
            // 4. Verify that without publishingWizard.defaultPublishFromTime config default time is set to "12:00"
            let actualTime = await contentPublishDialog.getValueInOnlineFrom();
            assert.ok(actualTime.includes(DEFAULT_TIME_POPUP), 'The default time should be displayed in the online from Picker Popup');
        });

    it(`WHEN schedule form has been added in the modal dialog THEN 'Confirm Schedule' button should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleButton();
            // 3. Verify that 'Confirm Schedule' button is enabled - online form is now by default
            await contentPublishDialog.waitForConfirmScheduleButtonEnabled();
            // 4. Fill in the 'online from' input
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_PAST);
            // 5. Verify that 'Schedule' button gets enabled in the modal dialog
            await contentPublishDialog.waitForConfirmScheduleButtonEnabled();
        });

    it(`GIVEN schedule form has been added in the modal dialog WHEN Cancel schedule-form button has been clicked THEN date time inputs gets hidden`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleButton();
            // 3. Click on 'Cancel Schedule Form'
            await contentPublishDialog.clickOnCancelScheduleFormButton();
            // 4. Schedule form should not be visible:
            await contentPublishDialog.waitForScheduleFormNotDisplayed();
            // 5. Verify that 'Schedule' button gets visible  again:
            await contentPublishDialog.waitForScheduleButtonDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
