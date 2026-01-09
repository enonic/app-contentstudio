/**
 * Created on 05.08.2019.
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

describe.skip('refresh.publish.dialog.spec - opens publish content modal dialog and checks control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const DEFAULT_TIME_POPUP = '12:00';
    const DATE_TIME_IN_PAST = '2022-01-10 00:00';

    // verifies https://github.com/enonic/app-contentstudio/issues/697
    //         https://github.com/enonic/lib-admin-ui/issues/1061
    it(`GIVEN 'Ready for publishing' folder is selected AND Publish dialog has been opened WHEN folder-link has been clicked in the dialog and a language has been selected THEN the workflow-status should be not updated in Publish Wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let folderName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(folderName);
            // 1. New folder has been added:(status of this folder is Ready for publishing)
            await studioUtils.doAddReadyFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 2. expand 'Publish Menu' and select 'Publish...' menu item, Publish Wizard should be loaded:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
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
            // let workflowStatus = await contentPublishDialog.getWorkflowState(FOLDER.displayName);
            // assert.equal(workflowStatus, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
            //     "'Mark as ready' status should be in the modal dialog");
            // // exception will be thrown when this button is enabled after 2000ms
            // await contentPublishDialog.waitForPublishNowButtonDisabled();
            // // 'Add Schedule' button  should not be displayed, because the content is `Work in progress`
            // await contentPublishDialog.waitForAddScheduleIconNotDisplayed();
        });

    it(`GIVEN schedule form has been added WHEN 'Online to' in past has been inserted THEN expected validation message should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let dateRangeInput = new DateRangeInput();
            // 1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. 'Schedule' icon should appear after making this content marked as ready
            await contentPublishDialog.clickOnMarkAsReadyButton();
            // 3. Verify that icon-calendar gets visible now. Click on this icon:
            await contentPublishDialog.clickOnAddScheduleIcon();
            await contentPublishDialog.typeInOnlineTo(DATE_TIME_IN_PAST);
            await contentPublishDialog.waitForScheduleValidationMessageDisplayed();
            let actualMsg = await contentPublishDialog.getScheduleValidationRecord();
            assert.strictEqual(actualMsg, appConst.VALIDATION_MESSAGE.SCHEDULE_FORM_ONLINE_PAST,
                'Expected validation message should appear');
        });

    it(`GIVEN schedule form has been added WHEN click on hours 'arrow down' (set the date in the future) icon in 'Online to' THEN validation message should not be displayed in the modal dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let dateRangeInput = new DateRangeInput();
            // 1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on this icon Add Schedule calendar icon:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Open 'Online To' date time picker popup:
            await contentPublishDialog.showOnlineToPickerPopup();
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_1');
            // Click on  'arrow up' in hours in the Online To Picker popup:
            await dateTimePickerPopup.clickOnHoursArrowDown();
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_2');
            await dateRangeInput.pause(1000);
            // 4. Verify that Picker popup is still displayed AND 23 hours is set for the current date:
            await dateRangeInput.waitForOnlineToPickerDisplayed();
            await dateTimePickerPopup.clickOnOkButton();
            // 5. Online to is in the future, so validation message should not be displayed:
            await contentPublishDialog.waitForScheduleValidationMessageNotDisplayed();
        });

    it(`GIVEN schedule form has been added WHEN click on hours 'arrow up' icon in 'Online to'(set time in the past) THEN validation message should be displayed in the modal dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            let dateRangeInput = new DateRangeInput();
            // 1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on this icon Add Schedule calendar icon:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Open 'Online To' date time picker popup:
            await contentPublishDialog.showOnlineToPickerPopup();
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_1');
            // 4. Click on  'arrow up' in hours in the Online To Picker popup:
            await dateTimePickerPopup.clickOnHoursArrowUp();
            await studioUtils.saveScreenshot('schedule_picker_popup_online_to_2');
            await dateRangeInput.pause(1000);
            // 5. Verify that Picker popup is still displayed AND date in the past has been set:
            await dateRangeInput.waitForOnlineToPickerDisplayed();
            await dateTimePickerPopup.clickOnOkButton();
            // 6. Online to is in the past, so validation message should  be displayed:
            await contentPublishDialog.waitForScheduleValidationMessageDisplayed();
            let message = await contentPublishDialog.getScheduleValidationRecord();
            assert.equal(message, appConst.VALIDATION_MESSAGE.SCHEDULE_FORM_ONLINE_PAST, 'Expected message - Online to cannot be in the past');
        });

    it(`GIVEN schedule form has been added in Publish Wizard modal dialog WHEN DatePicker popup has been opened THEN the 'online from' time is set to '12:00' by default`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Open Oline from Picker popup:
            await contentPublishDialog.showOnlineFormPickerPopup();
            // 4. Verify that without publishingWizard.defaultPublishFromTime config default time is set to "12:00"
            let actualTime = await dateTimePickerPopup.getTimeInOnlineFrom();
            assert.equal(actualTime, DEFAULT_TIME_POPUP, 'The default time should be displayed in the online from Picker Popup');
        });

    it(`WHEN schedule form has been added in the modal dialog THEN 'Schedule' button should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Verify that 'Schedule' button is disabled (online form is not filled)
            await contentPublishDialog.waitForScheduleButtonDisabled();
            // 4. Fill in the 'online from' input
            await contentPublishDialog.typeInOnlineFrom(DATE_TIME_IN_PAST);
            // 5. Verify that 'Schedule' button gets enabled in the modal dialog
            await contentPublishDialog.waitForScheduleButtonEnabled();
        });

    it(`GIVEN schedule form has been added in the modal dialog WHEN close schedule-form button has been clicked THEN date time inputs gets hidden`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Verify that 'Schedule' button is disabled (online from is not filled)
            await contentPublishDialog.waitForScheduleButtonDisabled();
            // 4. Click on 'Close Schedule Form'
            await contentPublishDialog.clickOnCloseScheduleFormButton();
            // 5. Schedule form should not be visible:
            await contentPublishDialog.waitForScheduleFormNotDisplayed();
            // 6. Verify that 'Add Schedule' button gets visible  again:
            await contentPublishDialog.waitForAddScheduleIconDisplayed();
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
