/**
 * Created on 25.12.2017. updated 30.03.2026 for epic-enonic-ui
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const LongForm = require('../../page_objects/wizardpanel/long.form.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('long.content.config.spec:  verifies `Min/max value config for Long`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;


    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN number in the allowed range has been typed THEN validation message should not be present`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            //1. Type number in the allowed range:
            await longForm.typeLong(1, 0);
            await longForm.pause(1000);
            await studioUtils.saveScreenshot('long_min_max_1');
            //2. Verify that input validation message is not displayed:
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN value less than min has been typed THEN validation record should be visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            //1. Type a value less than min:
            await longForm.typeLong(0, 0);
            //2. Verify that validation message gets visible:
            await studioUtils.saveScreenshot('long_min_max_2');
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(0, "The value cannot be less than 1");
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            // 1. Type a value that more than max:
            await longForm.typeLong(11, 0);
            // 2. Verify the validation message:
            await studioUtils.saveScreenshot('long_min_max_3');
            let actualText = await longForm.getFormValidationRecording();
            assert.equal(actualText, 'The value cannot be greater than 10', 'Validation recording should appear');
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN max value has been typed THEN input validation record should not be visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            // 1. Max value has been typed:
            await longForm.typeLong(10, 0);
            await longForm.pause(700);
            await studioUtils.saveScreenshot('long_min_max_4');
            // 2. Verify the validation message is not displayed:
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        });

    it(`GIVEN wizard for required 'Long(min 1,max 10)' is opened WHEN min value has been typed THEN input validation recording should not be visible`,
        async () => {
            let longForm = new LongForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            // 1. Min value has been typed:
            await longForm.typeLong(1, 0);
            await longForm.pause(700);
            await studioUtils.saveScreenshot('long_min_max_5');
            // 2. Verify the input validation message is not displayed:
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        });

    it(`GIVEN invalid value is typed AND validation recording is displayed WHEN valid value has been entered THEN the validation recording gets hidden`,
        async () => {
            let longForm = new LongForm();
            let contentWizardPanel = new ContentWizardPanel();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            await contentWizardPanel.typeDisplayName(appConst.generateRandomName('test'));
            //1. not valid value has been typed:
            await longForm.typeLong(3333, 0);
            //2. Verify that validation message gets visible:
            await longForm.waitForOccurrenceValidationRecordingDisplayedAt(0, "The value cannot be greater than 10");
            await studioUtils.saveScreenshot('long_min_max_invalid');
            //3. Type the correct value:
            await longForm.clearLongInput(0);
            await longForm.typeLong(7, 0);
            await longForm.pause(700);
            await studioUtils.saveScreenshot('long_min_max_valid');
            await longForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
            let isInvalid = await contentWizardPanel.isContentInvalid();
            assert.ok(isInvalid === false, "Content should not be invalid when valid value is entered");
        });

    // TODO
    it.skip(
        `GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN invalid value has been typed THEN 'Save' button should be disabled`,
        async () => {
            let longForm = new LongForm();
            let contentWizardPanel = new ContentWizardPanel();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.LONG_MIN_MAX);
            // 1. invalid value has been typed:
            await longForm.typeLong(333);
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
