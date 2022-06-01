/**
 * Created on 14.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const TextAreaForm = require('../../page_objects/wizardpanel/textarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('occurrences.texarea.content.spec: tests for content with textArea', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const TEXT_AREA_NAME_1 = contentBuilder.generateRandomName('textarea');
    const TEXT_AREA_NAME_2 = contentBuilder.generateRandomName('textarea');
    const TEXT_AREA_NAME_3 = contentBuilder.generateRandomName('textarea');
    const TEXT_AREA_NAME_4 = contentBuilder.generateRandomName('textarea');
    const TEXT_1 = "text1";
    const TEXT_2 = "text2";

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for required 'TextArea(1:1)' is opened WHEN text area is empty AND 'Save' button has been pressed THEN This field is required message should appear `,
        async () => {
            let textAreaForm = new TextAreaForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXT_AREA_1_1);
            await contentWizard.typeDisplayName(TEXT_AREA_NAME_1);
            //2. Verify that form validation recording does not appear until content is saved
            await textAreaForm.waitForFormValidationRecordingNotDisplayed();
            //3. Save the content
            await contentWizard.waitAndClickOnSave();
            //4. Verify the "This field is required" message appears
            let result = await textAreaForm.getFormValidationRecording();
            await studioUtils.saveScreenshot('textarea_req_empty');
            assert.equal(result, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, 'expected validation message should appear');
            //5. Verify that the content is invalid:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isTrue(isNotValid, 'the content should be not valid, because the input is required');
        });

    it(`GIVEN wizard for required 'TextArea(1:1)' is opened WHEN name input and text area have been filled THEN the content gets valid`,
        async () => {
            let textAreaForm = new TextAreaForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXT_AREA_1_1);
            await contentWizard.typeDisplayName(TEXT_AREA_NAME_2);
            //2. Type a text in text area:
            await textAreaForm.typeText(TEXT_1);
            //3. Verify that default action is 'Mark as Ready' now
            await contentWizard.waitForMarkAsReadyButtonVisible();
            await studioUtils.saveScreenshot('textarea_req_filled');
            //4. Verify that the content is valid:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isFalse(isNotValid, 'the content should be valid, because the input is filled');
            //5. Save the content
            await contentWizard.waitAndClickOnSave();
            //6. Verify that validation message is not visible:
            await textAreaForm.waitForFormValidationRecordingNotDisplayed();
        });

    it(`GIVEN wizard for not required 'TextArea(0:1)' is opened WHEN name input have been filled and text area is empty THEN the content gets valid`,
        async () => {
            let textAreaForm = new TextAreaForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXT_AREA_0_1);
            await contentWizard.typeDisplayName(TEXT_AREA_NAME_3);
            //2. Verify that default action is 'Mark as Ready' now
            await contentWizard.waitForMarkAsReadyButtonVisible();
            await studioUtils.saveScreenshot('textarea_not_req');
            //3. Verify that the content gets valid, because the text area is not required:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isFalse(isNotValid, 'the content should be valid, because the input is filled');
            //4. Save the content
            await contentWizard.waitAndClickOnSave();
            //5. Verify that validation message is not visible:
            await textAreaForm.waitForFormValidationRecordingNotDisplayed();
        });

    it(`GIVEN wizard for not required 'TextArea(2:4)' is opened WHEN name input have been filled and text areas are empty THEN the content should be invalid`,
        async () => {
            let textAreaForm = new TextAreaForm();
            let contentWizard = new ContentWizard();
            //1. open new wizard and fill in the name input:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXT_AREA_2_4);
            await contentWizard.typeDisplayName(TEXT_AREA_NAME_4);
            //2. Verify that the content is invalid, because 2 text area are required:
            let isNotValid = await contentWizard.isContentInvalid();
            assert.isTrue(isNotValid, 'the content should be invalid, because inputs are empty');
            //5. Save the content
            await contentWizard.waitAndClickOnSave();
            //6. Verify that validation message is displayed:
            let result = await textAreaForm.getFormValidationRecording();
            await studioUtils.saveScreenshot('textarea_req_2');
            assert.equal(result, "Min 2 valid occurrence(s) required", 'expected validation message should appear');
            //7. Verify that Add button is displayed:
            await textAreaForm.waitForAddButtonDisplayed();
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
