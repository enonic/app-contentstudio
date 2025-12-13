/**
 * Created on 15.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FieldSetForm = require('../../page_objects/wizardpanel/fieldset.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('fieldset.content.spec: tests for fieldSet content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const FIELDSET_NAME_1 = contentBuilder.generateRandomName('fieldset');
    const FIELDSET_NAME_2 = contentBuilder.generateRandomName('fieldset');
    const TEXT_1 = 'text1';
    const TEXT_2 = 'text2';
    const DOUBLE_1 = 1;
    const DOUBLE_2 = 2;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new FieldSet is opened WHEN required inputs have been filled THEN the content gets valid`,
        async () => {
            let fieldSetForm = new FieldSetForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in all required inputs:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.FIELDSET);
            await contentWizard.typeDisplayName(FIELDSET_NAME_1);
            await fieldSetForm.typeDouble(DOUBLE_1, 0);
            await fieldSetForm.typeDouble(DOUBLE_2, 1);
            await fieldSetForm.typeTextInTextLine(TEXT_2);
            await fieldSetForm.typeTextInHtmlArea(TEXT_1, 0);
            // 2. Verify that the content gets valid even before clicking on the 'Save' button
            let isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid === false, 'the content should be valid, because all required inputs are filled');
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('fieldset_required_filled');
            // 4. Verify that the content remains valid after clicking on 'Save' button:
            isInValid = await contentWizard.isContentInvalid();
            assert.ok(isInValid === false, 'the content should be valid, because all required inputs are filled');
        });

    it(`GIVEN required htmlArea and required textLine is empty WHEN Save button has been pressed THEN 2 validation recording should appear`,
        async () => {
            let fieldSetForm = new FieldSetForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard and fill in the name input :
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.FIELDSET);
            await contentWizard.typeDisplayName(FIELDSET_NAME_2);
            await studioUtils.saveScreenshot('fieldset_required_empty1');
            // 2. Required htmlArea and textLine are empty. Verify that the content is invalid.
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'the content should be invalid, because the required htmlArea and textline are empty');
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('fieldset_required_empty2');
            // 4. Verify that the content remains not valid after clicking on 'Save' button:
            isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'the content should be invalid, because the input is required');
            // 5. Verify that two validation recording appear after saving the content:
            let result = await fieldSetForm.getHtmlAreaValidationRecording();
            assert.equal(result, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message should be displayed");
            result = await fieldSetForm.getTextLineValidationRecording();
            assert.equal(result, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message should be displayed");
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
