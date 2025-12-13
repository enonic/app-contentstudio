/**
 * Created on 25.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DoubleForm = require('../../page_objects/wizardpanel/double.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');

describe('occurrences.double.spec: tests for content with Double inputs', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const VALID_DOUBLE = "123.4";
    const MAX_SAFE_DOUBLE = "9007199254740991";
    const MORE_MAX_SAFE_DOUBLE = "9007199254740991.6";
    const MIN_SAFE_DOUBLE = "-9007199254740991";
    const LESS_MIN_SAFE_DOUBLE = "-9007199254740991.8";
    const CONTENT_1 = contentBuilder.generateRandomName('double');
    const CONTENT_2 = contentBuilder.generateRandomName('double');
    const INVALID_VALUE = "123q";

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN max safe value has been typed THEN validation message should not be displayed`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            // 1. Type max safe value:
            await doubleForm.typeDouble(MAX_SAFE_DOUBLE);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('double_max_safe');
            // 2. Verify that input validation message is not displayed:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, "", 'Validation recording should not be displayed');
            // 3. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Double content should be valid");
        });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN value is more than MAX_SAFE has been typed THEN red border should be present in the double input`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            // 1. Type max safe value:
            await doubleForm.typeDouble(MORE_MAX_SAFE_DOUBLE);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('double_more_max_safe');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            // 3. Verify that the content is valid, because the double input is not required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Content should be valid");
            // 4. Verify thar red border appears in the Double input:
            await doubleForm.waitForRedBorderInDoubleInput(0);
        });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN min safe has been typed THEN red border should not be present in the double input`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            await contentWizard.typeDisplayName(CONTENT_1);
            // 1. Type max safe value:
            await doubleForm.typeDouble(MIN_SAFE_DOUBLE);
            await studioUtils.saveScreenshot('double_min_safe');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, "", 'Input validation recording should be empty');
            // 3. Verify that the content is valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Content should be valid");
            // 4. Verify thar red border is not displayed in the double input:
            await doubleForm.waitForRedBorderNotDisplayedInDoubleInput(0);
        });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN less than min safe has been typed THEN red border should appear in the double input`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_1);
            await contentWizard.typeDisplayName(CONTENT_1);
            // 1. Type max safe value:
            await doubleForm.typeDouble(LESS_MIN_SAFE_DOUBLE);
            await studioUtils.saveScreenshot('double_less_min_safe');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording appears in the input');
            // 3. Verify that the content is valid, the input is not required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Content should be valid");
            // 4. Verify thar red border appears in the double input:
            await doubleForm.waitForRedBorderInDoubleInput(0);
        });

    it(`GIVEN wizard for 'double 2:4' content is opened WHEN one valid value and one invalid value have been typed THEN red border should be present in the second double input`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_2_4);
            // 1. Type max safe value:
            await doubleForm.typeDouble(MAX_SAFE_DOUBLE);
            await doubleForm.typeDouble(MORE_MAX_SAFE_DOUBLE, 1);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('double_invalid_second_value');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await doubleForm.getOccurrenceValidationRecording(1);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            // 3. Verify that the content is not valid, because Min 2 valid occurrence(s) required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "Content should be invalid");
            // 4. Verify that red border appears in the second double input:
            await doubleForm.waitForRedBorderInDoubleInput(1);
            // 5. Verify that 'Min 2 valid occurrence(s) required' appears after clicking on Save button
            await contentWizard.waitAndClickOnSave();
            let formRecording = await doubleForm.getFormValidationRecording();
            assert.equal(formRecording, "Min 2 valid occurrence(s) required", 'Form validation recording should be displayed');
        });

    it(`GIVEN invalid value have been typed in both inputs('double 2:4') WHEN 'Save' button has been pressed THEN validation recording and 'Hide Details' button should appear`,
        async () => {
            let doubleForm = new DoubleForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_2_4);
            await contentWizard.typeDisplayName(CONTENT_2);
            // 1. Type an invalid value in both inputs:
            await doubleForm.typeDouble(INVALID_VALUE);
            await doubleForm.typeDouble(INVALID_VALUE, 1);
            await studioUtils.saveScreenshot('double_invalid_values');
            // 2. Verify the validation recordings for both inputs(Invalid value entered):
            let recording = await doubleForm.getOccurrenceValidationRecording(1);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            recording = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            // 3. Verify the red borders in both double inputs:
            await doubleForm.waitForRedBorderInDoubleInput(1);
            await doubleForm.waitForRedBorderInDoubleInput(0);
            // 4. click on 'Save' button:
            await contentWizard.waitAndClickOnSave();
            // 5. Verify that 'Hide details' button gets visible:
            await doubleForm.waitForHideDetailsButtonDisplayed();
            // 6. Click on 'Hide details' button:
            await doubleForm.clickOnHideDetailsButton();
            // 7. Verify that 'Show Details' button gets visible:
            await doubleForm.waitForShowDetailsButtonDisplayed();
            // 8. Verify that 'occurrence validation' recordings are cleared:
            let result1 = await doubleForm.getOccurrenceValidationRecording(1);
            let result2 = await doubleForm.getOccurrenceValidationRecording(0);
            assert.equal(result1, "", "The first 'occurrence validation' recording should be cleared");
            assert.equal(result2, "", "The second 'occurrence validation' recording should be cleared");
        });

    it(`WHEN invalid value have been typed in both inputs('double 2:4') THEN 'Hide Details' and 'Show details' buttons should not be displayed before saving the content`,
        async () => {
            let doubleForm = new DoubleForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_2_4);
            // 1. Type an invalid value in both inputs:
            await doubleForm.typeDouble(INVALID_VALUE);
            await doubleForm.typeDouble(INVALID_VALUE, 1);
            await studioUtils.saveScreenshot('double_invalid_values_2');
            await doubleForm.waitForShowDetailsButtonNotDisplayed();
            await doubleForm.waitForHideDetailsButtonNotDisplayed();
        });

    it(`GIVEN 'Filter Panel' is opened WHEN more than 5 content types are present THEN 'Show more' button should be displayed`,
        async () => {
            let filterPanel = new FilterPanel();
            // 1. Open Filter Panel:
            await studioUtils.openFilterPanel();
            // 2. Check the 'Show more' button in the filter panel
            let types = await filterPanel.geContentTypes();
            if (types.length >= 5) {
                await filterPanel.waitForShowMoreButtonDisplayed();
            } else {
                await filterPanel.waitForShowMoreButtonNotDisplayed();
            }
        });

    it(`GIVEN 'Filter Panel' is opened WHEN 'Show more' button has been clicked then THEN 'Show less' button gets visible`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Open Filter Panel:
            await studioUtils.openFilterPanel();
            //2. Check the 'Show more' button in the filter panel
            let types = await filterPanel.geContentTypes();
            if (types.length >= 5) {
                await filterPanel.clickOnShowMoreButton();
                //Verify that show less button gets visible:
                await filterPanel.waitForShowLessButtonDisplayed();
            }
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
