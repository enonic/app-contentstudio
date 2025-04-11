/**
 * Created on 25.12.2017.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DoubleForm = require('../../page_objects/wizardpanel/double.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('double.content.config.spec:  verifies `Min/max value config for Double`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies https://github.com/enonic/lib-admin-ui/issues/1887
    //Incorrect behaviour of validation of inputs with default values #1887
    it(`GIVEN wizard for 'Double(default value is 3)' is opened WHEN 'Add' button has been pressed AND the top input has been removed THEN validation message should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_DEFAULT_2_4);
            await contentWizard.typeDisplayName(appConst.generateRandomName('double'));
            // 1. Click on 'Add' button and add one more input:
            await doubleForm.clickOnAddButton();
            await doubleForm.pause(1000);
            let numberInputs = await doubleForm.getNumberOfInputs();
            assert.equal(numberInputs.length, 3, '3 double input should be displayed');
            // 2. Remove the top input:
            await doubleForm.clickOnRemoveIcon(0);
            // 3.Verify that number of inputs is 2:
            numberInputs = await doubleForm.getNumberOfInputs();
            assert.equal(numberInputs.length, 2, "Two double inputs should be displayed");
            // 4. Verify that the content is valid:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('double_default_value_1');
            assert.equal(recording, "", 'Validation recording should not be displayed');
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Double 2:4 content should be valid");
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN number from the allowed range has been typed THEN validation message should not be present`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_MIN_MAX);
            await doubleForm.typeDouble('1.1');
            // 1. Number in the allowed range has been typed
            await doubleForm.pause(1000);
            // 2. Verify the validation recording:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('double_min_max_1');
            assert.equal(recording, "", 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value less than 'min' has been typed THEN validation record should be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. value less than 'min' has been typed:
            await doubleForm.typeDouble('-1.1');
            // 2. Verify the validation recording:
            await studioUtils.saveScreenshot('double_min_max_2');
            let actualMessage = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(actualMessage, 'The value cannot be less than 0', 'expected validation recording should appear');
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. Value more than max has been typed
            await doubleForm.typeDouble('3.5');
            // 2. Verify the validation recording:
            await studioUtils.saveScreenshot('double_min_max_3');
            let actualMessage = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(actualMessage, 'The value cannot be greater than 3.14159', 'expected validation recording should appear');
            // 3. Verify that input is displayed with red border
            let isInputRed = await doubleForm.isInvalidValue(0);
            assert.ok(isInputRed, "input should be with red border");
        });

    it(`GIVEN wizard for required 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed and saved THEN this content should be not valid`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            let displayName = studioUtils.generateRandomName("double");
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. Value more than max has been typed
            await doubleForm.typeDouble('3.5');
            await contentWizard.typeDisplayName(displayName);
            // 2. Verify the validation recording:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('double_min_max_4');
            let actualMessage = await doubleForm.getOccurrenceValidationRecording(0);
            // 3. Verify the expected validation message:
            assert.equal(actualMessage, 'The value cannot be greater than 3.14159', 'expected validation recording should appear');
            // 4. Verify this content is not valid, because double input is required:
            await contentWizard.waitUntilInvalidIconAppears();
            // 5. Verify that validation form message gets visible after the saving:
            let validationMessage = await doubleForm.getFormValidationRecording();
            assert.equal(validationMessage, appConst.requiredValidationMessage(1),
                "Min 1 valid occurrence(s) required - this message should appear");
        });

    it(`GIVEN wizard for new content with 'Double(min 0,max 3.14159)' is opened WHEN max value has been typed THEN validation record should not be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName,  appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. Max value has been typed:
            await doubleForm.typeDouble('3.14159');
            await doubleForm.pause(1000);
            // 2. Verify the validation recording:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('double_min_max_4');
            // 3. Verify that Validation message is not displayed:
            assert.equal(recording, "", 'Validation recording should not be displayed');
            // 4. Verify that input is displayed with red border
            let isInputRed = await doubleForm.isInvalidValue(0);
            assert.ok(isInputRed === false, "input should be with green border");
        });

    it(`GIVEN wizard for new content with 'Double(min 0,max 3.14159)' is opened WHEN min value has been typed THEN validation record should not be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_MIN_MAX);
            //1. Min value has been typed:
            await doubleForm.typeDouble('0');
            await doubleForm.pause(1000);
            //2. Verify the validation recording:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('double_min_max_5');
            assert.equal(recording, "", 'Validation recording should not be displayed');
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
