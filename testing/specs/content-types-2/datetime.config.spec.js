/**
 * Created on 29.03.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DateTimeForm = require('../../page_objects/wizardpanel/datetime.form.panel');
const TimeForm = require('../../page_objects/wizardpanel/time/time.form.panel');
const DateForm = require('../../page_objects/wizardpanel/time/date.form.panel');
const DateTimePickerPopup = require('../../page_objects/wizardpanel/time/date.time.picker.popup');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const VersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('datetime.config.spec: tests for datetime content ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const VALID_DATE_TIME1 = '2015-02-28 19:01';
    const NOT_VALID_DATE_TIME1 = '2015-42-28 19:01';
    const DATE_TIME_NAME_1 = contentBuilder.generateRandomName('datetime');
    const DATE_TIME_NAME_2 = contentBuilder.generateRandomName('datetime');
    const DATE_TIME_NAME_3 = contentBuilder.generateRandomName('datetime');
    const TIME_NAME_1 = contentBuilder.generateRandomName('time');
    const DATE_NAME = contentBuilder.generateRandomName('date');
    const DATE_NAME_1 = contentBuilder.generateRandomName('date');
    const INCORRECT_TIME = '191:01';
    const DATE_IN_DECEMBER = '1999-12-31';
    const DATE_IN_DECEMBER_2 = '1999-12-30';
    const INCORRECT_DAY_DATE = '2015-15-32';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN 'now' value is configured in 'dateTime 2:4' WHEN wizard for new 'dateTime 2:4' is opened THEN both inputs with current DateTime should be displayed in the wizard",
        async () => {
            let dateTimeForm = new DateTimeForm();
            // 1. Open wizard for new dateTime 2:4 with configuration:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_NOW_CONFIG);
            // 2. Get default values in both inputs:
            let values = await dateTimeForm.getDateTimes();
            await studioUtils.saveScreenshot('date_time_configured_now');
            let expectedDate = new Date().toISOString().substring(0, 10);
            // 3. Verify the values:
            assert.ok(values.length === 2, 'Two dateTime values should be present in the wizard page');
            assert.equal(values[0], values[1], 'Both values must be the same');
            assert.ok(values[0].includes(expectedDate), "Expected date time should be displayed");
        });

    it("GIVEN wizard for new Date(1:1) is opened AND date in december has been saved WHEN the content has been reopened THEN expected date should be present",
        async () => {
            let dateForm = new DateForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new date 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_1_1);
            // 2. Save a date:
            await contentWizard.typeDisplayName(DATE_NAME);
            await dateForm.typeDate(0, DATE_IN_DECEMBER);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('date_content_saved');
            // 3. Reopen te content
            await studioUtils.doCloseWizardAndSwitchToGrid();
            // 4. Verify the saved date:
            await studioUtils.selectAndOpenContentInWizard(DATE_NAME);
            let actualDAte = await dateForm.getValueInDateInput(0);
            assert.equal(actualDAte, DATE_IN_DECEMBER, 'Expected and actual dates should be equal');
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'The date content should be valid');
        });

    it("GIVEN existing Date(1:1) content is opened AND the date has been updated WHEN the previous version has been reverted THEN expected date should appear",
        async () => {
            let dateForm = new DateForm();
            let contentWizard = new ContentWizard();
            let versionsWidget = new VersionsWidget();
            // 1. existing Date(1:1) content is opened
            await studioUtils.selectAndOpenContentInWizard(DATE_NAME);
            // 2. Update the date:
            await dateForm.typeDate(0, DATE_IN_DECEMBER_2);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('date_updated');
            await contentWizard.openVersionsHistoryPanel();
            // 3. Revert the previous version:
            await versionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED,1);
            await versionsWidget.clickOnRestoreButton();
            await contentWizard.waitForNotificationMessage();
            // 4. Verify the reverted date:
            let result = await dateForm.getValueInDateInput(0);
            assert.equal(result, DATE_IN_DECEMBER, 'The previous date should be displayed after reverting');
        });

    it("GIVEN wizard for new Date(1:1) is opened WHEN incorrect date has been typed THEN date content should be invalid",
        async () => {
            let dateForm = new DateForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new date 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_1_1);
            // 2. Type a name and incorrect date:
            await dateForm.typeDate(0, INCORRECT_DAY_DATE);
            await contentWizard.typeDisplayName(DATE_NAME_1);
            await studioUtils.saveScreenshot('date_content_incorrect_value');
            // 3. Verify the red border in the date input
            await dateForm.waitForRedBorderInDateInput(0);
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'The date content should be invalid');
            let validationMessage = await dateForm.getOccurrenceValidationRecording(0);
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'validation recording should appear');
        });

    it("GIVEN wizard for new DateTime(1:1) with timezone is opened WHEN date time input has been clicked THEN date time picker popup dialog with timezone gets visible",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let dateTimePickerPopup = new DateTimePickerPopup();
            // 1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            // 2. Click on date time input and show the picker:
            await dateTimeForm.showPicker();
            await dateTimePickerPopup.waitForLoaded();
            await studioUtils.saveScreenshot('date_time_picker');
            // 3. Verify that time zone is present in the popup:
            await dateTimePickerPopup.waitForTimeZoneDisplayed();
        });

    it("GIVEN wizard for new DateTime(1:1) opened WHEN only name input is filled in AND Save button has been pressed THEN the content should not be valid",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let contentWizard = new ContentWizard();
            //1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            //2. Fill in the name input and click on Save button:
            await contentWizard.typeDisplayName(DATE_TIME_NAME_1);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //3. Verify the message 'This field is required'
            let actualMessage = await dateTimeForm.getFormValidationRecording();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, 'expected validation recording should appear');
            //4. Verify that the content is not valid:
            let isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid, 'The content should be invalid, because the input is required');
        });

    it("GIVEN wizard for new DateTime(1:1) opened WHEN name and valid date time have been typed in AND 'Save' button has been pressed THEN the content should be valid",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            // 2. Fill in the name input and click on Save button:
            await contentWizard.typeDisplayName(DATE_TIME_NAME_2);
            await dateTimeForm.typeDatetime(0, VALID_DATE_TIME1);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 3. Verify the validation message is not displayed
            await dateTimeForm.waitForFormValidationRecordingNotDisplayed();
            // 4. Verify that the content is valid:
            let isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid === false, 'The content should be valid, because correct value inserted in the required input');
            // 5. Verify that default action is 'Mark as Ready' now
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    it("GIVEN wizard for new DateTime(1:1) with tz is opened WHEN not valid date time has been typed THEN red border appears in the input AND the content should be not valid",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            // 2. Fill in the name input and click on Save button:
            await contentWizard.typeDisplayName(DATE_TIME_NAME_3);
            await dateTimeForm.typeDatetime(0, NOT_VALID_DATE_TIME1);
            // 3. Verify the validation message
            let validationMessage = await dateTimeForm.getOccurrenceValidationRecording(0);
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'validation recording should appear');
            // 4. Verify that the content is not valid:
            let isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid, 'The content should be invalid, because invalid value inserted in the required input');
            // 5. Verify that datetime input has red border(the value is not valid)
            await dateTimeForm.waitForRedBorderDisplayedInDateTimeInput(0);
        });

    it("GIVEN wizard for not required 'Time 0:1' is opened WHEN time in incorrect format has been typed THEN 'Publish' menu item should be enabled, because the input is not required",
        async () => {
            let timeForm = new TimeForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new not required Time 0:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TIME_0_1);
            // 2. FInsert incorrect time:
            await contentWizard.typeDisplayName(TIME_NAME_1);
            await timeForm.typeTime(0, INCORRECT_TIME);
            // 3. Verify the expected validation message appears:
            let validationMessage = await timeForm.getOccurrenceValidationRecording(0);
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'validation recording should appear');
            // 4. Verify that the content is valid, because the input is not required:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'the content should be valid, because not correct value is inserted in the not required input');
            // 5. Verify that the time input has red border(the value is not valid)
            await timeForm.waitForRedBorderDisplayedInTimeInput(0);
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
