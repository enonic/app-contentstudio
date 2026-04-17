/**
 * Created on 25.12.2017. updated on 07.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const DoubleForm = require('../../page_objects/wizardpanel/double.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('double.content.config.spec:  verifies `Min/max value config for Double`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    //Verifies https://github.com/enonic/lib-admin-ui/issues/1887
    //Incorrect behaviour of validation of inputs with default values #1887
    // TODO bug
    it(`GIVEN wizard for 'Double(default value is 3)' is opened WHEN 'Add' button has been pressed AND the top input has been removed THEN validation message should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_DEFAULT_2_4);
            await contentWizard.typeDisplayName(appConst.generateRandomName('double'));
            // 1. Click on 'Add' button and add one more input:
            await doubleForm.clickOnAddButton();
            await doubleForm.pause(1000);
            let numberInputs = await doubleForm.getDoubleInputs();
            assert.equal(numberInputs.length, 3, '3 double input should be displayed');
            // 2. Remove the top input field
            await doubleForm.clickOnRemoveIcon(0);
            // 3.Verify that number of inputs is 2:
            numberInputs = await doubleForm.getDoubleInputs();
            assert.equal(numberInputs.length, 2, "Two double inputs should be displayed");
            // 4. Verify that validation recording gets not visible
            await doubleForm.waitForFormValidationRecordingNotDisplayed();
            await studioUtils.saveScreenshot('double_default_value_1');
            // 5. Verify that the content is valid:
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN wizard for required 'Double(min 0,max 3.14159)' is opened WHEN number from the allowed range has been typed THEN validation message should not be present`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_MIN_MAX);
            await contentWizard.typeDisplayName(appConst.generateRandomName('double'));
            await doubleForm.typeDouble('1.1');
            // 1. Number in the allowed range has been typed
            await doubleForm.pause(1000);
            // 2. Verify the validation recording:
            await doubleForm.waitForFormValidationRecordingNotDisplayed();
            await studioUtils.saveScreenshot('double_min_max_1');
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value less than 'min' has been typed THEN validation record should be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. value less than 'min' has been typed:
            await doubleForm.typeDouble('-1.1');
            // 2. Verify the validation recording:
            await studioUtils.saveScreenshot('double_min_max_2');
            // expected validation recording should appear:
            await doubleForm.waitForOccurrenceValidationRecordingDisplayedAt(0, 'The value cannot be less than 0');
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. Value more than max has been typed
            await doubleForm.typeDouble('3.5');
            // 2. Verify the validation recording:
            await studioUtils.saveScreenshot('double_min_max_3');
            await doubleForm.waitForOccurrenceValidationRecordingDisplayedAt(0, 'The value cannot be greater than 3.14159');
        });

    it(`GIVEN wizard for required 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed and saved THEN this content should be invalid`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            let displayName = studioUtils.generateRandomName('double');
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_MIN_MAX);
            // 1. Value more than max has been typed
            await doubleForm.typeDouble('3.5');
            await contentWizard.typeDisplayName(displayName);
            // 2. Verify the validation recording:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('double_min_max_4');
            let actualValue = await doubleForm.getValueFromInput(0);
            assert.equal(actualValue,'','Invalid values should be cleared after the content is saved.');
            // 4. Verify this content is invalid, because double input is required:
            await contentWizard.waitUntilInvalidIconAppears();
            // 5. Verify that validation form message gets visible after the saving:
            let validationMessage = await doubleForm.getFormValidationRecording();
            assert.equal(validationMessage, appConst.requiredValidationMessage(1),
                "Min 1 valid occurrence(s) required - this message should appear");
        });

    it(`GIVEN wizard for new content with 'Double(min 0,max 3.14159)' is opened WHEN max value has been typed THEN validation record should not be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_MIN_MAX);
            await contentWizard.typeDisplayName(appConst.generateRandomName('double'));
            // 1. Max value has been typed:
            await doubleForm.typeDouble('3.14159');
            await doubleForm.pause(1000);
            // 2. Verify the validation recording is not displayed:
            await doubleForm.waitForFormValidationRecordingNotDisplayed();
            await studioUtils.saveScreenshot('double_min_max_4');
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN wizard for new content with 'Double(min 0,max 3.14159)' is opened WHEN min value has been typed THEN validation record should not be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_MIN_MAX);
            await contentWizard.typeDisplayName(appConst.generateRandomName('double'));
            //1. Min value has been typed:
            await doubleForm.typeDouble('0');
            await doubleForm.pause(1000);
            // 2. Verify the validation recording is not displayed:
            await doubleForm.waitForFormValidationRecordingNotDisplayed();
            await studioUtils.saveScreenshot('double_min_max_5');
            await contentWizard.waitUntilInvalidIconDisappears();
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
