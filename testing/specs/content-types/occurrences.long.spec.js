/**
 * Created on 13.10.2021 updated on 30.03.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const LongForm = require('../../page_objects/wizardpanel/long.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('occurrences.long.spec:  tests for content with Long inputs', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const INVALID_LONG = '123.4';
    const MAX_SAFE_LONG = Number.MAX_SAFE_INTEGER;
    const MORE_MAX_SAFE_LONG = Number.MAX_SAFE_INTEGER + 1;
    const MIN_SAFE_LONG = "-9007199254740991";
    const LESS_MIN_SAFE_LONG = "-9007199254740992";
    const CONTENT_1 = contentBuilder.generateRandomName('long');
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;


    it(`GIVEN wizard for required 'Long(2:4)' is opened WHEN the invalid value has been typed in 2 inputs THEN validation message should be displayed for 2 inputs`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_2_4);
            // 1. Type invalid values in 2 inputs:
            await longForm.typeLong(LESS_MIN_SAFE_LONG, 0);
            await longForm.pause(500);
            await longForm.clickOnAddButton();
            await longForm.typeLong(LESS_MIN_SAFE_LONG, 2);
            await studioUtils.saveScreenshot('long_2_invalid_values');
            // 2. Verify that input validation message is displayed:
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(0, 'Invalid value entered');
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(1);
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(2, 'Invalid value entered');
        });

    it(`GIVEN wizard for not required 'Long(0:1)' is opened WHEN the maximum safe value has been entered THEN the content becomes invalid as well`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_0_1);
            // 1. Type max safe value:
            await longForm.typeLong(MAX_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await contentWizard.waitUntilInvalidIconDisappears();
            await studioUtils.saveScreenshot('long_max_safe');
            // 2. Verify that input validation message is not displayed:
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
            // 3. Verify that the content becomes valid as well
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'The content should be valid');
            let actualState = await contentWizard.getContentWorkflowState();
            assert.equal(actualState, appConst.ICON_WORKFLOW_STATE.IN_PROGRESS, 'The content should be in in-progress state in wizard');

        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN a value greater than MAX_SAFE has been entered THEN red border should be present in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_0_1);
            // 1. Type max safe value:
            await longForm.typeLong(MORE_MAX_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_more_max_safe');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(0, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED);
            // 3. Verify that the content is invalid, the content gets invalid as well:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid , 'The content should be invalid');
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN the minimum safe value has been entered THEN red border should not be present in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_0_1);
            //1. Type max safe value:
            await longForm.typeLong(MIN_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_min_safe');
            //2. Verify that input validation message(Invalid value entered) is displayed:
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
            //3. Verify that the content should be valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'The content should be valid');
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN the entered value is below MIN_SAFE THEN the content becomes invalid as well`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_0_1);
            // 1. less than min safe has been typed:
            await longForm.typeLong(LESS_MIN_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_less_min_safe');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(0, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED);
            // 3. Verify that the content becomes invalid as well
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid , 'The content should be invalid');
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN invalid value has been entered THEN red border should be present in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_0_1);
            // 1. Type max safe value:
            await longForm.typeLong(INVALID_LONG,0);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_invalid_value');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(0, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED);
            // 3. Verify that the content is valid, because the long input is not required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "The content should be invalid");
        });

    it(`GIVEN wizard for new 'long 2:4' content is opened WHEN values have been entered in both inputs, and one is invalid THEN red border should be present in the second long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_2_4);
            //1. Type max safe value:
            await longForm.typeLong(MAX_SAFE_LONG, 0);
            await longForm.typeLong(INVALID_LONG, 1);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_invalid_second_value');
            // 2. Verify that input validation message(Invalid value entered) is displayed:
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(1, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED);
            // 3. Verify that the content is invalid, because Min 2 valid occurrence(s) required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "The content should be invalid");
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
