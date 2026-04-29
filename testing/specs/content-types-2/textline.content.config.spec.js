/**
 * Created on 28.12.2017. updated on 24.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const TextLine = require('../../page_objects/wizardpanel/textline.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('textline.content.config.spec:  verifies `max-length value config for textLine`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const IP_ADDRESS = '127.0.0.1';

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed AND Saved THEN 'Min 1 valid occurrence(s) required' should be visible`,
        async () => {
            let textLine = new TextLine();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('textline');
            // 1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            await contentWizard.typeDisplayName(displayName);
            // 2. Clear the default value then Type the text(more than MAX LENGTH)
            await textLine.clearTextLine(0);
            await textLine.typeText('123456789123', 0);
            // 3. Verify the "Text is too long" message appears
            //await textLine.waitForOccurrenceValidationRecordingDisplayedAt(0, appConst.VALIDATION_MESSAGE.TEXT_IS_TOO_LONG);
            // 4. Save the content
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('text_line_issue_1957');
            // 5. Verify that "Min 1 valid occurrence(s) required" gets visible:
            let validationMessage = await textLine.getFormValidationRecording();
            assert.equal(validationMessage, appConst.requiredValidationMessage(1),
                "Min 1 valid occurrence(s) required - this message should appear");
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 5 chars has been typed THEN validation message should not be present`,
        async () => {
            let textLine = new TextLine();
            // 1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            // 2. Type the text(less than MAX LENGTH)
            await textLine.clearTextLine(0);
            await textLine.typeText('hello');
            await textLine.pause(1000);
            // 3. Verify that Input Validation recording is not visible:
            await textLine.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
            await studioUtils.saveScreenshot('text_line_max_length_1');
            // 4. Verify total-counter and left-counter
            let totalCounter = await textLine.getTotalCounter(0);
            assert.equal(totalCounter, "5/11", "Expected counter should be displayed");
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 11 chars has been typed THEN validation record should not be visible`,
        async () => {
            let textLine = new TextLine();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            // Type the text( length==MAX LENGTH)
            await textLine.clearTextLine(0);
            await textLine.typeText('12345678901');
            await textLine.pause(1000);
            // validation recording should not be visible:
            await studioUtils.saveScreenshot('text_line_max_length_4');
            await textLine.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/3190
    // Wizard does not load for text line with regexp in config
    it(`GIVEN wizard for 'TextLine'  with regexp is opened WHEN correct ip-address has been typed THEN validation record should not be visible`,
        async () => {
            let textLine = new TextLine();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.TEXTLINE_REGEXP);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('textline'));
            // 1. Type the valid ip address:
            await textLine.typeText(IP_ADDRESS);
            // 2. Save the content
            await textLine.pause(1000);
            // validation recording should not be visible:
            await textLine.waitForOccurrenceValidationRecordingNotDisplayedAt(0);
            await studioUtils.saveScreenshot('text_line_regexp_1');
            // 3. Verify that content is valid before saving
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Content should be valid in wizard");
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
