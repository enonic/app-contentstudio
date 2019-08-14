/**
 * Created on 25.12.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DoubleForm = require('../page_objects/wizardpanel/double.form.panel');

describe('double.content.config.spec:  verifies `Min/max value config for Double`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN number from the allowed range has been typed THEN validation message should not be present`,
        () => {
            let doubleForm = new DoubleForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX).then(()=> {
                return doubleForm.typeDouble('1.1');
            }).then(()=>{
                return doubleForm.pause(1000);
            }).then(()=> {
                return doubleForm.isValidationRecordingVisible();
            }).then(result=> {
                studioUtils.saveScreenshot('double_min_max_1');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value less than 'min' has been typed THEN validation record should be visible`,
        () => {
            let doubleForm = new DoubleForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX).then(()=> {
                return doubleForm.typeDouble('-1.1');
            }).then(()=> {
                return doubleForm.waitForValidationRecording();
            }).then(result=> {
                studioUtils.saveScreenshot('double_min_max_2');
                assert.isTrue(result, 'Validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN less than min has been typed THEN correct validation recording should be displayed`,
        () => {
            let doubleForm = new DoubleForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX).then(()=> {
                return doubleForm.typeDouble('-1.1');
            }).then(()=>{
                return doubleForm.pause(1000);
            }).then(()=> {
                return doubleForm.getValidationRecord();
            }).then(text=> {
                studioUtils.saveScreenshot('double_min_max_2');
                assert.isTrue(text == 'The value cannot be less than 0', 'correct validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        () => {
            let doubleForm = new DoubleForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX).then(()=> {
                return doubleForm.typeDouble('3.5');
            }).then(()=> {
                return doubleForm.waitForValidationRecording();
            }).then(result=> {
                studioUtils.saveScreenshot('double_min_max_3');
                assert.isTrue(result, 'Validation recording should appear');
            });
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN max value has been typed THEN validation record should not be visible`,
        () => {
            let doubleForm = new DoubleForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double_max').then(() => {
                return doubleForm.typeDouble('3.14159');
            }).then(()=>{
                return doubleForm.pause(1000);
            }).then(()=> {
                return doubleForm.isValidationRecordingVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot('double_min_max_4');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    it(`GIVEN wizard for 'Double(min 0,max 3.14159)' is opened WHEN min value has been typed THEN validation record should not be visible`,
        () => {
            let doubleForm = new DoubleForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.DOUBLE_MIN_MAX).then(()=> {
                return doubleForm.typeDouble('0');
            }).then(()=>{
                return doubleForm.pause(1000);
            }).then(()=> {
                return doubleForm.isValidationRecordingVisible();
            }).then(result=> {
                studioUtils.saveScreenshot('double_min_max_5');
                assert.isFalse(result, 'Validation recording should not be displayed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
