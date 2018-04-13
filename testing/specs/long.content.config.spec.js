/**
 * Created on 25.12.2017.
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
const longForm = require('../page_objects/wizardpanel/long.form.panel');


describe('long.content.config.spec:  verifies `Min/max value config for Long`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN wizard for 'Long(min 1,max 10)' is opened WHEN number from the allowed range has been typed THEN validation message should not be present`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX).then(()=> {
                return longForm.typeLong(1);
            }).pause(1000).then(()=> {
                return longForm.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('long_min_max_1');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    it(`GIVEN wizard for 'Long(min 1,max 10)' is opened WHEN value less than min has been typed THEN validation record should be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX).then(()=> {
                return longForm.typeLong(0);
            }).then(()=> {
                return longForm.waitForValidationRecording();
            }).then((result)=> {
                studioUtils.saveScreenshot('long_min_max_2');
                assert.isTrue(result, 'Validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'Long(min 1,max 10)' is opened WHEN value less than min has been typed THEN correct validation recording should be displayed`,
        () => {

            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX).then(()=> {
                return longForm.typeLong(0);
            }).pause(1000).then(()=> {
                return longForm.getValidationRecord();
            }).then((text)=> {
                studioUtils.saveScreenshot('long_min_max_2_2');
                assert.isTrue(text == 'The value cannot be less than 1', 'correct alidation recording should appear');
            });
        });

    it(`GIVEN wizard for 'Long(min 1,max 10)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX).then(()=> {
                return longForm.typeLong(11);
            }).then(()=> {
                return longForm.waitForValidationRecording();
            }).then((result)=> {
                studioUtils.saveScreenshot('long_min_max_3');
                assert.isTrue(result, 'Validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'Long(min 1,max 10)' is opened WHEN max value has been typed THEN validation record should not be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX).then(()=> {
                return longForm.typeLong(10);
            }).pause(1000).then(()=> {
                return longForm.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('long_min_max_4');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    it(`GIVEN wizard for 'Long(min 1,max 10)' is opened WHEN min value has been typed THEN validation record should not be visible`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX).then(()=> {
                return longForm.typeLong(1);
            }).pause(1000).then(()=> {
                return longForm.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('long_min_max_5');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
