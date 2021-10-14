/**
 * Created on 13.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const LongForm = require('../../page_objects/wizardpanel/long.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('occurrences.long.spec:  tests for content validation for Long(0:1,1:1,1)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const NOT_VALID_LONG1 = "123.4";
    const MAX_SAFE_LONG = "9007199254740991";
    const MORE_MAX_SAFE_LONG = "9007199254740992";
    const MIN_SAFE_LONG = "-9007199254740991";
    const LESS_MIN_SAFE_LONG = "-9007199254740992";
    const CONTENT_1 = contentBuilder.generateRandomName('long');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for not required 'Long(0:1)' is opened WHEN max safe value has been typed THEN validation message should not be displayed`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_0_1);
            //1. Type max safe value:
            await longForm.typeLong(MAX_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_max_safe');
            //2. Verify that input validation message is not displayed:
            let recording = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, "", 'Validation recording should not be displayed');
            //3. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN value is more than MAX_SAFE has been typed THEN red border should be present in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_0_1);
            //1. Type max safe value:
            await longForm.typeLong(MORE_MAX_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_more_max_safe');
            //2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            //3. Verify that the content is valid, because the long input is not required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
            //4. Verify thar red border appears in the long input:
            await longForm.waitForRedBorderInLongInput(0);
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN min safe has been typed THEN red border should not be present in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_0_1);
            //1. Type max safe value:
            await longForm.typeLong(MIN_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_min_safe');
            //2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, "", 'Input validation recording should be empty');
            //3. Verify that the content is valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
            //4. Verify thar red border is not displayed in the long input:
            await longForm.waitForRedBorderNotDisplayedInLongInput(0);
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN less than min safe has been typed THEN red border should appear in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_0_1);
            //1. Type max safe value:
            await longForm.typeLong(LESS_MIN_SAFE_LONG);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_less_min_safe');
            //2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording appears in the input');
            //3. Verify that the content is valid, the input is not required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
            //4. Verify thar red border appears in the long input:
            await longForm.waitForRedBorderInLongInput(0);
        });

    it(`GIVEN wizard for not required 'long' content is opened WHEN invalid value has been typed THEN red border should be present in the long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_0_1);
            //1. Type max safe value:
            await longForm.typeLong(NOT_VALID_LONG1);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_invalid_value');
            //2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            //3. Verify that the content is valid, because the long input is not required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "Content should be valid");
            //4. Verify thar red border appears in the long input:
            await longForm.waitForRedBorderInLongInput(0);
        });

    it(`GIVEN wizard for 'long 2:4' content is opened WHEN values in both inputs have been typed and one is invalid THEN red border should be present in the second long input`,
        async () => {
            let longForm = new LongForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_2_4);
            //1. Type max safe value:
            await longForm.typeLong(MAX_SAFE_LONG);
            await longForm.typeLong(NOT_VALID_LONG1, 1);
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('long_invalid_second_value');
            //2. Verify that input validation message(Invalid value entered) is displayed:
            let recording = await longForm.getOccurrenceValidationRecording(1);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Input validation recording should be displayed');
            //3. Verify that the content is not valid, because Min 2 valid occurrence(s) required
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Content should be not valid");
            //4. Verify thar red border appears in the second long input:
            await longForm.waitForRedBorderInLongInput(1);
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
