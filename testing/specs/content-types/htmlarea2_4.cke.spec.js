/**
 * Created on 27.04.2018. updated on 23.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('htmlarea2_4.cke.spec:  html area with CKE`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const EXPECTED_TEXT_TEXT1 = '<p>test text</p>';
    const EXPECTED_TEXT_TEXT2 = '<p>test text 2</p>';
    const TEXT_1 = 'test text';
    const TEXT_2 = 'test text 2';
    let HTML_AREA_CONTENT2_4;
    let CONTENT_EMPTY_HTML_AREA;
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    it(`WHEN only the name is entered AND the “Save” button is pressed, THEN the content should be saved`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('htmlarea');
            CONTENT_EMPTY_HTML_AREA = contentBuilder.buildHtmlArea(displayName, 'htmlarea2_4', TEXT_1, TEXT_2);
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_2_4);
            await contentWizard.pause(1000);
            // 2. Type a name and save
            await contentWizard.typeDisplayName(displayName);
            await contentWizard.waitAndClickOnSave();
            // 3. Verify the notification message:
            let EXPECTED_MESSAGE = appConst.itemSavedNotificationMessage(displayName);
            // 'expected notification message should appear'
            await contentWizard.waitForExpectedNotificationMessage(EXPECTED_MESSAGE);
        });

    it(`WHEN existing 'htmlArea 2:4'(both areas are empty) has been opened THEN validation recording should be displayed in the form`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content:
            await studioUtils.selectContentAndOpenWizard(CONTENT_EMPTY_HTML_AREA.displayName);
            let result = await htmlAreaForm.getFormValidationRecording();
            await studioUtils.saveScreenshot('htmlarea_2_4_empty_area');
            // 2. Verify that validation record is displayed: 'Min 2 valid occurrence(s) required'
            assert.equal(result, appConst.requiredValidationMessage(2), "Expected validation record should be displayed");
            // 3. Verify that red icon is present:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === true, "Red icon should be present, because both inputs are empty");
        });

    it(`GIVEN wizard for 'htmlArea 2:4' is opened WHEN html area is empty and the content has been saved THEN red icon should appear, because the input is required`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_2_4);
            await contentWizard.typeDisplayName('test_area2_4');
            await htmlAreaForm.clickOnAddButton();
            // 2. Type a name and save:
            await contentWizard.waitAndClickOnSave();
            // 3. Verify that red icon gets visible:
            let isInvalid = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('cke_htmlarea_should_be_invalid');
            assert.ok(isInvalid === true, 'the content should be invalid, because the input is required');
        });

    it(`GIVEN wizard for 'htmlArea 2:4' is opened WHEN text has been typed in the first area THEN the text should be present in the first area`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_2_4);
            // 2. Type a text in the first area
            await htmlAreaForm.typeTextInHtmlArea('test text');
            // 3. Verify that the text is displayed in the first area:
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('cke_html_area2');
            assert.equal(actualResult[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
            assert.equal(actualResult[1], '', 'the second area should be empty');
        });

    it(`GIVEN wizard for new 'htmlArea 2:4' is opened WHEN a text has been inserted in both areas THEN expected text should be present in areas`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('htmlarea');
            HTML_AREA_CONTENT2_4 = contentBuilder.buildHtmlArea(displayName, 'htmlarea2_4', TEXT_1, TEXT_2);
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_2_4);
            await contentWizard.pause(1000);
            // 2. Type a name and insert text in both areas:
            await contentWizard.typeData(HTML_AREA_CONTENT2_4);
            // 3. Save the content:
            await contentWizard.waitAndClickOnSave();
            // 4. Verify the text
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('cke_html_area2');
            assert.equal(actualResult[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
            assert.equal(actualResult[1], EXPECTED_TEXT_TEXT2, 'expected and actual value should be equals');
        });

    it(`GIVEN existing 'htmlArea 2:4' WHEN it has been opened THEN expected text should be displayed in the area`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content:
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT2_4.displayName);
            // 2. Verify the text in both htmlArea
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('htmlarea_2_4_check_value');
            assert.equal(actualResult[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equal');
            assert.equal(actualResult[1], EXPECTED_TEXT_TEXT2, 'expected and actual value should be equal');
            // 3. Verify that the content is valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Red icon should not be present, because both inputs are filled");
        });

    // verifies https://github.com/enonic/lib-admin-ui/issues/461
    it(`GIVEN existing 'htmlArea 2:4' WHEN the first area has been cleared THEN red icon should appears in the wizard`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content:
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT2_4.displayName);
            // 2. Clear the first htmlArea
            await htmlAreaForm.clearHtmlArea(0);
            // 3. Verify the text in both htmlArea:
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('htmlarea_2_4_cleared');
            assert.equal(actualResult[0], '', 'the first area should be empty');
            assert.equal(actualResult[1], EXPECTED_TEXT_TEXT2, 'text should be in the second area');
            // 4. Verify that red icon gets visible
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === true, "Red icon should appear in the wizard, because both inputs are required");
            let validationRecord = await htmlAreaForm.getFormValidationRecording();
            // 'Min 2 valid occurrence(s) required'
            assert.equal(validationRecord, appConst.requiredValidationMessage(2), "Expected validation record gets visible");
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
