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
const textAreaForm = require('../page_objects/wizardpanel/textarea.form.panel');

describe('textarea.content.config.spec:  verifies `max-length value config for TextArea`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let string42 = 'qwertyuiopasdfghjklzxcvbnm1234567890qwerty';
    let string41 = 'qwertyuiopasdfghjklzxcvbnm1234567890qwert';

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

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 5 chars has been typed THEN validation message should not be present`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':textarea_conf').then(()=> {
                return textAreaForm.typeText('hello');
            }).pause(1000).then(()=> {
                return textAreaForm.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('textarea_max_length_1');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 42 chars has been typed THEN validation record should be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTAREA_MAX_LENGTH).then(()=> {
                return textAreaForm.typeText(string42);
            }).then(()=> {
                return textAreaForm.waitForValidationRecording();
            }).then((result)=> {
                studioUtils.saveScreenshot('textarea_max_length_2');
                assert.isTrue(result, 'Validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 42 chars has been typed THEN correct validation recording should be displayed`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':textarea_conf').then(()=> {
                return textAreaForm.typeText(string42);
            }).pause(1000).then(()=> {
                return textAreaForm.getValidationRecord();
            }).then((text)=> {
                studioUtils.saveScreenshot('textarea_max_length_3');
                assert.isTrue(text == 'Text cannot be more than 41 characters long', 'correct validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'TextArea(max-length is 41)' is opened WHEN 41 chars has been typed THEN validation record should not be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':textarea_conf').then(()=> {
                return textAreaForm.typeText(string41);
            }).pause(1000).then(()=> {
                return textAreaForm.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('textarea_max_length_4');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
