/**
 * Created on 28.12.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const TextLine = require('../page_objects/wizardpanel/textline.form.panel');

describe('textline.content.config.spec:  verifies `max-length value config for textLine`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 5 chars has been typed THEN validation message should not be present`,
        async () => {
            let textLine = new TextLine();
            //1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH);
            //2. Type the text(less than MAX LENGTH)
            await textLine.typeText('hello');
            await textLine.pause(1000);
            let result = await textLine.isValidationRecordingVisible();
            studioUtils.saveScreenshot('textline_max_length_1');
            assert.isFalse(result, 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed THEN validation record gets visible`,
        async () => {
            let textLine = new TextLine();
            //1. open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH);
            //2. Type text (more than MAX LENGTH)
            await textLine.typeText('123456789123');
            let result = await textLine.waitForValidationRecording();
            studioUtils.saveScreenshot('textline_max_length_2');
            assert.isTrue(result, 'Validation recording gets visible');
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed THEN expected validation recording should be displayed`,
        async () => {
            let textLine = new TextLine();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH);
            //2. Type text (more than MAX LENGTH)
            await textLine.typeText('123456789123');
            await textLine.pause(1000);
            let text = await textLine.getValidationRecord();
            studioUtils.saveScreenshot('textline_max_length_3');
            assert.equal(text, appConstant.VALIDATION_MESSAGE.TEXT_IS_TOO_LONG, 'expected validation recording should appear');
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 11 chars has been typed THEN validation record should not be visible`,
        async () => {
            let textLine = new TextLine();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH);
            //Type the text( MAX LENGTH)
            await textLine.typeText('12345678901');
            await textLine.pause(1000);
            let result = await textLine.isValidationRecordingVisible();
            studioUtils.saveScreenshot('textline_max_length_4');
            assert.isFalse(result, 'Validation recording should not be displayed');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
