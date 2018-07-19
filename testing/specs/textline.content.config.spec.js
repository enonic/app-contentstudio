/**
 * Created on 28.12.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const textLine = require('../page_objects/wizardpanel/textline.form.panel');

describe('textline.content.config.spec:  verifies `max-length value config for textLine`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 5 chars has been typed THEN validation message should not be present`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH).then(()=> {
                return textLine.typeText('hello');
            }).pause(1000).then(()=> {
                return textLine.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('textline_max_length_1');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed THEN validation record should be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH).then(()=> {
                return textLine.typeText('123456789123');
            }).then(()=> {
                return textLine.waitForValidationRecording();
            }).then(result=> {
                studioUtils.saveScreenshot('textline_max_length_2');
                assert.isTrue(result, 'Validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 12 chars has been typed THEN correct validation recording should be displayed`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH).then(()=> {
                return textLine.typeText('123456789123');
            }).pause(1000).then(()=> {
                return textLine.getValidationRecord();
            }).then((text)=> {
                studioUtils.saveScreenshot('textline_max_length_3');
                assert.isTrue(text == 'Text cannot be more than 11 characters long', 'correct validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'TextLine(max-length is 11)' is opened WHEN 11 chars has been typed THEN validation record should not be visible`,
        () => {

            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_MAX_LENGTH).then(()=> {
                return textLine.typeText('12345678901');
            }).pause(1000).then(()=> {
                return textLine.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('textline_max_length_4');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
