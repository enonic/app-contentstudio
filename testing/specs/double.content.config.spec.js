/**
 * Created on 25.12.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DoubleForm = require('../page_objects/wizardpanel/double.form.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('double.content.config.spec:  verifies `Min/max value config for Double`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN number from the allowed range has been typed THEN validation message should not be present`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX);
            await doubleForm.typeDouble('1.1');
            //1. Number in the allowed range has been typed
            await doubleForm.pause(1000);
            //2. Verify the validation recording:
            let isVisible = await doubleForm.isValidationRecordingVisible();
            studioUtils.saveScreenshot('double_min_max_1');
            assert.isFalse(isVisible, 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value less than 'min' has been typed THEN validation record should be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX);
            //1. value less than 'min' has been typed:
            await doubleForm.typeDouble('-1.1');
            //2. Verify the validation recording:
            let isVisible = await doubleForm.waitForValidationRecording();
            studioUtils.saveScreenshot('double_min_max_2');
            assert.isTrue(isVisible, 'Validation recording should appear');
            let actualMessage = await doubleForm.getValidationRecord();
            assert.equal(actualMessage, 'The value cannot be less than 0', 'expected validation recording should appear');
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX);
            //1. Value more than max has been typed
            await doubleForm.typeDouble('3.5');
            //2. Verify the validation recording:
            await doubleForm.waitForValidationRecording();
            studioUtils.saveScreenshot('double_min_max_3');
            let actualMessage = await doubleForm.getValidationRecord();
            //3. Verify the expected validation message:
            assert.equal(actualMessage, 'The value cannot be greater than 3.14159', 'expected validation recording should appear');
            //4. Verify that input is displayed with red border
            let isInputRed = await doubleForm.isInvalidValue(0);
            assert.isTrue(isInputRed, "input should be with red border");
        });

    it(`GIVEN wizard for required 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed and saved THEN this content should be not valid`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            let displayName = studioUtils.generateRandomName("double");
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX);
            //1. Value more than max has been typed
            await doubleForm.typeDouble('3.5');
            await contentWizard.typeDisplayName(displayName);
            //2. Verify the validation recording:
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('double_min_max_4');
            let actualMessage = await doubleForm.getValidationRecord();
            //3. Verify the expected validation message:
            assert.equal(actualMessage, 'The value cannot be greater than 3.14159', 'expected validation recording should appear');
            //4. Verify this content is not valid, because double input is required:
            await contentWizard.waitUntilInvalidIconAppears();
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN max value has been typed THEN validation record should not be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double_max');
            //1. Max value has been typed:
            await doubleForm.typeDouble('3.14159');
            await doubleForm.pause(1000);
            //2. Verify the validation recording:
            let isVisible = await doubleForm.isValidationRecordingVisible();
            studioUtils.saveScreenshot('double_min_max_4');
            //3. Verify that Validation message is not displayed:
            assert.isFalse(isVisible, 'Validation recording should not be displayed');
            //4. Verify that input is displayed with red border
            let isInputRed = await doubleForm.isInvalidValue(0);
            assert.isFalse(isInputRed, "input should be with green border");
        });

    it(`GIVEN wizard for new 'Double(min 0,max 3.14159)' is opened WHEN min value has been typed THEN validation record should not be visible`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX);
            //1. Min value has been typed:
            await doubleForm.typeDouble('0');
            await doubleForm.pause(1000);
            //2. Verify the validation recording:
            let isVisible = await doubleForm.isValidationRecordingVisible();
            studioUtils.saveScreenshot('double_min_max_5');
            assert.isFalse(isVisible, 'Validation recording should not be displayed');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
