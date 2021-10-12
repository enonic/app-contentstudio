/**
 * Created on 29.03.2021.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DateTimeForm = require('../../page_objects/wizardpanel/datetime.form.panel');
const TimeForm = require('../../page_objects/wizardpanel/time/time.form.panel');
const DateTimePickerPopup = require('../../page_objects/wizardpanel/time/date.time.picker.popup');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('datetime.config.spec: tests for datetime content ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const VALID_DATE_TIME1 = "2015-02-28 19:01";
    const NOT_VALID_DATE_TIME1 = "2015-42-28 19:01";
    const DATE_TIME_NAME_1 = contentBuilder.generateRandomName('datetime');
    const DATE_TIME_NAME_2 = contentBuilder.generateRandomName('datetime');
    const DATE_TIME_NAME_3 = contentBuilder.generateRandomName('datetime');
    const TIME_NAME_1 = contentBuilder.generateRandomName('time');
    const INCORRECT_TIME = "191:01";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN 'now' value is configured in 'dateTime 2:4' WHEN wizard for new 'dateTime 2:4' is opened THEN both inputs with current DateTime should be displayed in the wizard",
        async () => {
            let dateTimeForm = new DateTimeForm();
            //1. Open wizard for new dateTime 2:4 with configuration:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_NOW_CONFIG);
            //2. Get default values in both inputs:
            let values = await dateTimeForm.getDateTimes();
            await studioUtils.saveScreenshot('date_time_configured_now');
            let expectedDate = new Date().toISOString().substring(0, 10);
            //3. Verify the values:
            assert.isTrue(values.length === 2, "Two dateTime values should be present in the wizard page");
            assert.equal(values[0], values[1], "Both values must be the same");
            assert.isTrue(values[0].includes(expectedDate), "Expected date time should be displayed");
        });

    it("GIVEN wizard for new DateTime(1:1) with timezone is opened WHEN date time input has been clicked THEN date time picker popup dialog with timezone gets visible",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let dateTimePickerPopup = new DateTimePickerPopup();
            //1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            //2. Click on date time input and show the picker:
            await dateTimeForm.showPicker();
            await dateTimePickerPopup.waitForLoaded();
            await studioUtils.saveScreenshot('date_time_picker');
            //3. Verify that time zone is present in the popup:
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
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isTrue(isNotValid, 'the content should be not valid, because the input is required');
        });

    it("GIVEN wizard for new DateTime(1:1) opened WHEN name and valid date time have been typed in AND 'Save' button has been pressed THEN the content should be valid",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let contentWizard = new ContentWizard();
            //1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            //2. Fill in the name input and click on Save button:
            await contentWizard.typeDisplayName(DATE_TIME_NAME_2);
            await dateTimeForm.typeDatetime(0, VALID_DATE_TIME1);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //3. Verify the validation message is not displayed
            await dateTimeForm.waitForFormValidationRecordingNotDisplayed();
            //4. Verify that the content is valid:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isFalse(isNotValid, 'the content should be valid, because correct value inserted in the required input');
            //5. Verify that default action is 'Mark as Ready' now
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    it("GIVEN wizard for new DateTime(1:1) opened WHEN not valid date time has been typed THEN red border appears in the input AND the content should be not valid",
        async () => {
            let dateTimeForm = new DateTimeForm();
            let contentWizard = new ContentWizard();
            //1. Open wizard for new dateTime 1:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DATE_TIME_1_1);
            //2. Fill in the name input and click on Save button:
            await contentWizard.typeDisplayName(DATE_TIME_NAME_3);
            await dateTimeForm.typeDatetime(0, NOT_VALID_DATE_TIME1);
            //3. Verify the validation message
            let validationMessage = await dateTimeForm.getOccurrenceValidationRecording(0);
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'validation recording should appear');
            //4. Verify that the content is not valid:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isTrue(isNotValid, 'the content should be not valid, because not valid value inserted in the required input');
            //5. Verify that datetime input has red border(the value is not valid)
            await dateTimeForm.waitForRedBorderInInputDisplayed(0);
        });

    it("GIVEN wizard for not required 'Time 0:1' is opened WHEN time in incorrect format has been typed THEN 'Publish' menu item should be enabled, because the input is not required",
        async () => {
            let timeForm = new TimeForm();
            let contentWizard = new ContentWizard();
            //1. Open wizard for new not required Time 0:1
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TIME_0_1);
            //2. FInsert incorrect time:
            await contentWizard.typeDisplayName(TIME_NAME_1);
            await timeForm.typeTime(0, INCORRECT_TIME);
            //3. Verify the expected validation message appears:
            let validationMessage = await timeForm.getOccurrenceValidationRecording(0);
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'validation recording should appear');
            //4. Verify that the content is valid, because the input is not required:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isFalse(isNotValid, 'the content should be valid, because not correct value is inserted in the not required input');
            //5. Verify that the time input has red border(the value is not valid)
            await timeForm.waitForRedBorderInInputDisplayed(0);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
