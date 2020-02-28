/**
 * Created on 25.12.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const LongForm = require('../page_objects/wizardpanel/long.form.panel');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');

describe('long.content.config.spec:  verifies `Min/max value config for Long`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN number in the allowed range has been typed THEN validation message should not be present`,
        async() = > {
            let longForm = new LongForm();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. Type number in the allowed range:
    await
    longForm.typeLong(1);
    await
    longForm.pause(1000);
    //2. Verify that validation message is not displayed:
    let isVisible = await
    longForm.isValidationRecordingVisible();
    studioUtils.saveScreenshot('long_min_max_1');
    assert.isFalse(isVisible, 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN value less than min has been typed THEN validation record should be visible`,
        async() = > {
            let longForm = new LongForm();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. Type a value less than min:
    await
    longForm.typeLong(0);
    //2. Verify that validation message gets visible:
    let isVisible = await
    longForm.waitForValidationRecording();
    studioUtils.saveScreenshot('long_min_max_2');
    assert.isTrue(isVisible, 'Validation recording should appear');
    let actualText = await
    longForm.getValidationRecord();
    assert.equal(actualText, 'The value cannot be less than 1', 'expected validation recording should appear');
        });

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN value more than max has been typed THEN validation record should appear`,
        async() = > {
            let longForm = new LongForm();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. Type a value value more than max:
    await
    longForm.typeLong(11);
    //2. Verify the validation message:
    let isVisible = await
    longForm.waitForValidationRecording();
    studioUtils.saveScreenshot('long_min_max_3');
    assert.isTrue(isVisible, 'Validation recording should appear');
    let actualText = await
    longForm.getValidationRecord();
    assert.equal(actualText, 'The value cannot be greater than 10', 'expected validation recording should appear');
        });

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN max value has been typed THEN validation record should not be visible`,
        async() = > {
            let longForm = new LongForm();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. Max value has been typed:
    await
    longForm.typeLong(10);
    await
    longForm.pause(700);
    //2. Verify the validation message is not present:
    let isVisible = await
    longForm.isValidationRecordingVisible();
    studioUtils.saveScreenshot('long_min_max_4');
    assert.isFalse(isVisible, 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN min value has been typed THEN validation record should not be visible`,
        async() = > {
            let longForm = new LongForm();
    return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. Min value has been typed:
    await
    longForm.typeLong(1);
    await
    longForm.pause(700);
    let isVisible = await
    longForm.isValidationRecordingVisible();
    //2. Verify the validation message is not present:
    studioUtils.saveScreenshot('long_min_max_5');
    assert.isFalse(isVisible, 'Validation recording should not be displayed');
})
    ;

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN invalid value has been typed THEN validation record gets visible`,
        async() = > {
        let longForm = new LongForm();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. Min value has been typed:
    await
    longForm.typeLong("aa");
    //2. Verify that validation message gets visible:
    await
    longForm.waitForValidationRecording();
    studioUtils.saveScreenshot('long_min_max_6');
    let actualText = await
    longForm.getValidationRecord();
    assert.equal(actualText, 'Invalid value entered', 'expected validation recording should appear');
})
    ;

    it(`GIVEN invalid value is typed AND validation message is present WHEN valid value has been typed THEN validation record gets hidden`,
        async() = > {
        let longForm = new LongForm();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. not valid value has been typed:
    await
    longForm.typeLong("aa");
    //2. Verify that validation message gets visible:
    await
    longForm.waitForValidationRecording();
    studioUtils.saveScreenshot('long_min_max_7');
    //3. Type the correct value:
    await
    longForm.typeLong(7);
    await
    longForm.pause(700);
    let isVisible = await
    longForm.isValidationRecordingVisible();
    studioUtils.saveScreenshot('long_min_max_8');
    assert.isFalse(isVisible, 'Validation recording gets hidden');
})
    ;

    it(`GIVEN wizard for 'Long(min 1,max 10,required)' is opened WHEN not valid value has been typed THEN 'Save' button should be disabled`,
        async() = > {
        let longForm = new LongForm();
    let contentWizardPanel = new ContentWizardPanel();
    await
    studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.LONG_MIN_MAX);
    //1. not valid value has been typed:
    await
    longForm.typeLong("aa");
    //2. Verify that 'Save' button is disabled:
    await
    longForm.waitForValidationRecording();
    await
    contentWizardPanel.waitForSaveButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
