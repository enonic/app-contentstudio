/**
 * Created on 25.10.2021 updated on 31.03.2026 for epic-enonic-ui
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const DoubleForm = require('../../page_objects/wizardpanel/double.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');

describe('occurrences.double.spec: tests for content with Double inputs', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const VALID_DOUBLE = '123.4';
    const MAX_SAFE_DOUBLE = '9007199254740991';
    const MORE_MAX_SAFE_DOUBLE = '9007199254740991.6';
    const MIN_SAFE_DOUBLE = '-9007199254740991';
    const LESS_MIN_SAFE_DOUBLE = '-9007199254740991.8';
    const CONTENT_1 = contentBuilder.generateRandomName('double');
    const CONTENT_2 = contentBuilder.generateRandomName('double');
    const INVALID_VALUE = '123q';

    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN max safe value has been typed THEN validation message should not be displayed`, async () => {
        let doubleForm = new DoubleForm();
        let contentWizard = new ContentWizard();
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_0_1);
        // 1. Type max safe value:
        await doubleForm.typeDouble(MAX_SAFE_DOUBLE);
        await contentWizard.typeDisplayName(CONTENT_1);
        await studioUtils.saveScreenshot('double_max_safe');
        // 2. Verify that input validation message is not displayed:
        await doubleForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        // 3. Verify that the content becomes valid, red icon in wizard should disappear:
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid === false, 'The Double content should be valid');
    });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN a value beyond MAX_SAFE has been typed THEN the value is accepted`, async () => {
        let doubleForm = new DoubleForm();
        let contentWizard = new ContentWizard();
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_0_1);
        // 1. Type max safe value:
        await doubleForm.typeDouble(MORE_MAX_SAFE_DOUBLE);
        await contentWizard.typeDisplayName(CONTENT_1);
        await studioUtils.saveScreenshot('double_more_max_safe');
        // 2. Verify that no validation message is displayed, the value is a finite number:
        await doubleForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);

        // 3. Verify that the content is valid, because the double input is not required
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid === false, 'Content should be valid');
    });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN min safe has been typed THEN red border should not be present in the double input`, async () => {
        let doubleForm = new DoubleForm();
        let contentWizard = new ContentWizard();
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_0_1);
        await contentWizard.typeDisplayName(CONTENT_1);
        // 1. Type max safe value:
        await doubleForm.typeDouble(MIN_SAFE_DOUBLE, 0);
        await studioUtils.saveScreenshot('double_min_safe');
        // 2. Verify that input validation message(Invalid value entered) is displayed:
        let recording = await doubleForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        // 3. Verify that the content is valid
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid === false, 'The double content should be valid');
    });

    it(`GIVEN wizard for content with a not required 'double' is opened WHEN a value below MIN_SAFE has been typed THEN the value is accepted`, async () => {
        let doubleForm = new DoubleForm();
        let contentWizard = new ContentWizard();
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_0_1);
        await contentWizard.typeDisplayName(CONTENT_1);
        // 1. Type max safe value:
        await doubleForm.typeDouble(LESS_MIN_SAFE_DOUBLE);
        await studioUtils.saveScreenshot('double_less_min_safe');
        // 2. Verify that no validation message is displayed, the value is a finite number:
        await doubleForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        // 3. Verify that the content is valid, the input is not required
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid === false, 'The double content should be valid');
    });

    it(`GIVEN wizard for 'double 2:4' content is opened WHEN values beyond MAX_SAFE have been typed in both inputs THEN the content gets valid`, async () => {
        let doubleForm = new DoubleForm();
        let contentWizard = new ContentWizard();
        await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.DOUBLE_2_4);
        // 1. Type values beyond the safe range in both inputs:
        await doubleForm.typeDouble(MORE_MAX_SAFE_DOUBLE, 0);
        await doubleForm.typeDouble(MORE_MAX_SAFE_DOUBLE, 1);
        await contentWizard.typeDisplayName(CONTENT_1);
        await studioUtils.saveScreenshot('double_beyond_safe_values');
        // 2. Verify that no validation message is displayed for both inputs:
        await doubleForm.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        await doubleForm.waitForOccurrenceValidationRecordingNotDisplayedAt(1);
        // 3. Verify that the content is valid, both required occurrences are filled in
        let isInvalid = await contentWizard.isContentInvalid();
        assert.ok(isInvalid === false, 'The Content should be valid');
    });

    it(`GIVEN 'Filter Panel' is opened WHEN more than 5 content types are present THEN 'Show more' button should be displayed`, async () => {
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

    it(`GIVEN 'Filter Panel' is opened WHEN 'Show more' button has been clicked then THEN 'Show less' button gets visible`, async () => {
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
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
