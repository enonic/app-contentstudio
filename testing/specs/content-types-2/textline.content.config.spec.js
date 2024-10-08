/**
 * Created on 28.12.2017.
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
    let SITE;
    const IP_ADDRESS = '127.0.0.1';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed AND Saved THEN 'Min 1 valid occurrence(s) required' should be visible`,
        async () => {
            let textLine = new TextLine();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('textline');
            // 1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            await contentWizard.typeDisplayName(displayName);
            // 2. Type the text(more than MAX LENGTH)
            await textLine.typeText('123456789123');
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            // 4. Verify the "Text is too long" message appears
            let result = await textLine.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('textline_issue_1957');
            assert.equal(result, appConst.VALIDATION_MESSAGE.TEXT_IS_TOO_LONG, 'occurrence validation recording gets visible');
            // 5. Verify that "Min 1 valid occurrence(s) required" gets visible:
            let validationMessage = await textLine.getFormValidationRecording();
            assert.equal(validationMessage, appConst.requiredValidationMessage(1),
                "Min 1 valid occurrence(s) required - this message should appear");
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 5 chars has been typed THEN validation message should not be present`,
        async () => {
            let textLine = new TextLine();
            // 1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            // 2. Type the text(less than MAX LENGTH)
            await textLine.typeText('hello');
            await textLine.pause(1000);
            // 3. Verify that Input Validation recording is not visible:
            let result = await textLine.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('textline_max_length_1');
            assert.equal(result, "", 'Input Validation recording should not be displayed');
            // 4. Verify total-counter and left-counter
            let totalCounter = await textLine.getTotalCounter(0);
            assert.equal(totalCounter, "5 character(s)", "Expected message should be displayed");
            let leftCounter = await textLine.getRemaining(0);
            assert.equal(leftCounter, "6 remaining", "Expected message should be displayed");
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed THEN input validation record gets visible`,
        async () => {
            let textLine = new TextLine();
            // 1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            // 2. Type text (more than MAX LENGTH)
            await textLine.typeText('123456789123');
            let result = await textLine.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('textline_max_length_2');
            // 3. Verify input validation message:
            assert.equal(result, appConst.VALIDATION_MESSAGE.TEXT_IS_TOO_LONG, 'Validation recording gets visible');
            // 4. Verify total-counter and left-counter values
            let totalCounter = await textLine.getTotalCounter(0);
            assert.equal(totalCounter, "12 character(s)", "Expected message should be displayed");
            let leftCounter = await textLine.getRemaining(0);
            assert.equal(leftCounter, "-1 remaining", "Expected message should be displayed");
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 11 chars has been typed THEN validation record should not be visible`,
        async () => {
            let textLine = new TextLine();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_MAX_LENGTH);
            // Type the text( length==MAX LENGTH)
            await textLine.typeText('12345678901');
            await textLine.pause(1000);
            // validation recording should not be visible:
            let result = await textLine.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('textline_max_length_4');
            assert.equal(result, "", 'Input Validation recording should not be displayed');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/3190
    // Wizard does not load for text line with regexp in config
    it(`GIVEN wizard for 'TextLine'  with regexp is opened WHEN correct ip-address has been typed THEN validation record should not be visible`,
        async () => {
            let textLine = new TextLine();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_REGEXP);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('textline'));
            // 1. Type the valid ip address:
            await textLine.typeText(IP_ADDRESS);
            // 2. Save the content
            await textLine.pause(1000);
            // validation recording should not be visible:
            let result = await textLine.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('textline_regexp_1');
            assert.equal(result, "", 'Input Validation recording should not be displayed');
            // 3. Verify that content is valid before saving
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Content should ve valid in wizard");
            // text input should be with green border:
            let isValid = await textLine.isRegExStatusValid(0);
            assert.ok(isValid, "Valid status should be present in the text input");
        });

    it(`GIVEN wizard for 'TextLine'  with regexp is opened WHEN correct ip-address has been typed AND saved THEN validation record should not be visible`,
        async () => {
            let textLine = new TextLine();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_REGEXP);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('textline'));
            // 1. Type the valid ip address:
            await textLine.typeText(IP_ADDRESS);
            // 2. Save the content
            await contentWizard.waitAndClickOnSave();
            await textLine.pause(300);
            // validation recording should not be visible:
            let result = await textLine.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('textline_regexp_2');
            assert.equal(result, "", 'Input Validation recording should not be displayed');
            // 3. Verify that content is valid after saving
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "Content should ve valid in wizard");
            // text input should be with green border:
            let isValid = await textLine.isRegExStatusValid(0);
            assert.ok(isValid, "Valid status should be present in the text input");
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
