/**
 * Created on 18.08.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const LocaleCodeCustomValidationForm = require('../../page_objects/wizardpanel/locale.code.custom.validation');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('inputs.custom.validation.spec: tests for content with custom validation', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME = contentBuilder.generateRandomName('content');
    const NOT_ALLOWED_OPTION = 'Arabic (Egypt)';
    const ALLOWED_OPTION = 'English (United States)';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new content with custom validation is opened WHEN not allowed option has been selected in the combobox AND saved THEN required validation message gets visible`,
        async () => {
            let localeCodeCustomValidationForm = new LocaleCodeCustomValidationForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.LOCALE_CODE);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 2. Fill in the first text input with valid value
            await localeCodeCustomValidationForm.typeTextInTextInput('en-En');
            // 3. Select a not allowed option:
            await localeCodeCustomValidationForm.typeTextAndSelectOption(NOT_ALLOWED_OPTION);
            // 4. Click on 'Save' button
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('custom_validation_not_allowed_option');
            // 5. Verify that validation message:
            let actualMessage = await localeCodeCustomValidationForm.getSelectorValidationMessage();
            assert.equal(actualMessage, 'Invalid value selected', "Expected validation message should be displayed");
            // 6. Verify that the content remains invalid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'the content should be invalid, this value is invalid');
        });

    it(`GIVEN existing content with custom validation is opened WHEN valid option has been selected in the combobox AND saved THEN the content gets valid`,
        async () => {
            let localeCodeCustomValidationForm = new LocaleCodeCustomValidationForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Remove the invalid selected option:
            await localeCodeCustomValidationForm.removeSelectedOption(NOT_ALLOWED_OPTION);
            // 3. Select the valid option:
            await localeCodeCustomValidationForm.typeTextAndSelectOption(ALLOWED_OPTION);
            // 4. Click on 'Save' button
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('custom_validation_allowed_option');
            // 4. Verify that the content gets valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'the content should be valid');
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
