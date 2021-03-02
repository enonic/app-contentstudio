/**
 * Created on 28.12.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const TextAreaForm = require('../page_objects/wizardpanel/textarea.form.panel');

describe('textarea.content.config.spec:  verifies max-length value for TextArea', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let string42 = 'qwertyuiopasdfghjklzxcvbnm1234567890qwerty';
    let string41 = 'qwertyuiopasdfghjklzxcvbnm1234567890qwert';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 5 chars has been typed THEN validation message should not be present`,
        async () => {
            let textAreaForm = new TextAreaForm();
            //1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'textarea_conf');
            //2. Type the allowed length:
            await textAreaForm.typeText('hello');
            await textAreaForm.pause(1000);
            let result = await textAreaForm.isValidationRecordingVisible();
            studioUtils.saveScreenshot('textarea_max_length_1');
            assert.isFalse(result, 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 42 chars has been typed THEN validation record should be visible`,
        async () => {
            let textAreaForm = new TextAreaForm();
            //1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTAREA_MAX_LENGTH);
            //2. Type not allowed length:
            await textAreaForm.typeText(string42);
            let result = await textAreaForm.waitForValidationRecording();
            studioUtils.saveScreenshot('textarea_max_length_2');
            assert.isTrue(result, 'Validation recording should appear');
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 42 chars has been typed THEN expected validation recording should appear`,
        async () => {
            let textAreaForm = new TextAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'textarea_conf');
            await textAreaForm.typeText(string42);
            await textAreaForm.pause(1000);
            let text = await textAreaForm.getValidationRecord();
            studioUtils.saveScreenshot('textarea_max_length_3');
            assert.equal(text, appConstant.VALIDATION_MESSAGE.TEXT_IS_TOO_LONG, 'expected validation recording should appear');
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 41 chars has been typed THEN validation record should not be visible`,
        async () => {
            let textAreaForm = new TextAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'textarea_conf');
            // max-length text has been typed:
            await textAreaForm.typeText(string41);
            await textAreaForm.pause(1000);
            let result = await textAreaForm.isValidationRecordingVisible();
            studioUtils.saveScreenshot('textarea_max_length_4');
            assert.isFalse(result, 'Validation recording should not be displayed');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
