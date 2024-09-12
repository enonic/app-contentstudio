/**
 * Created on 25.12.2017.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const LongForm = require('../../page_objects/wizardpanel/long.form.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('long.content.config.spec:  verifies `Min/max value config for Long`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN number in the allowed range has been typed THEN validation message should not be present`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            //1. Type number in the allowed range:
            await longForm.typeLong(1);
            await longForm.pause(1000);
            await studioUtils.saveScreenshot('long_min_max_1');
            //2. Verify that input validation message is not displayed:
            let recording = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(recording, "", 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN value less than min has been typed THEN validation record should be visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            //1. Type a value less than min:
            await longForm.typeLong(0);
            //2. Verify that validation message gets visible:
            await studioUtils.saveScreenshot('long_min_max_2');
            let actualText = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(actualText, 'The value cannot be less than 1', 'expected validation recording should appear');
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            // 1. Type a value that more than max:
            await longForm.typeLong(11);
            // 2. Verify the validation message:
            await studioUtils.saveScreenshot('long_min_max_3');
            let actualText = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(actualText,'The value cannot be greater than 10', 'Validation recording should appear');
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN max value has been typed THEN input validation record should not be visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            // 1. Max value has been typed:
            await longForm.typeLong(10);
            await longForm.pause(700);
            await studioUtils.saveScreenshot('long_min_max_4');
            // 2. Verify the validation message is not displayed:
            let actualText = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(actualText,"", 'Input Validation recording should not be displayed');
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN min value has been typed THEN input validation recording should not be visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            // 1. Min value has been typed:
            await longForm.typeLong(1);
            await longForm.pause(700);
            await studioUtils.saveScreenshot('long_min_max_5');
            // 2. Verify the input validation message is not present:
            let actualText = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(actualText,"", 'Input Validation recording should not be displayed');
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN invalid value has been typed THEN validation recording gets visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            //1. not valid value has been typed:
            await longForm.typeLong("aa");
            //2. Verify that input validation message gets visible:
            await studioUtils.saveScreenshot('long_min_max_6');
            let actualText = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(actualText, 'Invalid value entered', 'expected input validation recording should appear');
        });

    it(`GIVEN invalid value is typed AND validation message is present WHEN valid value has been typed THEN validation recording gets hidden`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            //1. not valid value has been typed:
            await longForm.typeLong("aa");
            //2. Verify that validation message gets visible:
            let actualText = await longForm.getOccurrenceValidationRecording(0);
            assert.equal(actualText, 'Invalid value entered', 'expected validation recording should appear');
            await studioUtils.saveScreenshot('long_min_max_7');
            //3. Type the correct value:
            await longForm.typeLong(7);
            await longForm.pause(700);
            actualText = await longForm.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('long_min_max_8');
            assert.equal(actualText,"", 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN invalid value has been typed THEN 'Save' button should be disabled`,
        async () => {
            let longForm = new LongForm();
            let contentWizardPanel = new ContentWizardPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LONG_MIN_MAX);
            // 1. invalid value has been typed:
            await longForm.typeLong('aa');
            // 2. Verify that 'Save' button is disabled:
            await contentWizardPanel.waitForSaveButtonDisabled();
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
