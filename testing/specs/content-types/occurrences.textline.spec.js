/**
 * Created on 26.08.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const TextLine = require('../../page_objects/wizardpanel/textline.form.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe('occurrences.textline.spec: tests for textline(0-1,1-0, 1-1)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    const TEXT = "test text";
    const TEXT_2 = "test text 2";
    const TEXT_3 = "test text 3";
    let SITE;
    const TEXTLINE_0_1 = contentBuilder.generateRandomName('textline');
    const TEXTLINE_1_0 = contentBuilder.generateRandomName('textline');
    const TEXTLINE_1_1 = contentBuilder.generateRandomName('textline');


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new TextLine-content (0:1) is opened WHEN display name has been typed THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open wizard for new textline:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_0_1);
            //2. Type a name
            await contentWizard.typeDisplayName(TEXTLINE_0_1);
            //3. Verify that 'Add' button is not displayed:
            await textLine.waitForAddButtonNotDisplayed();
            //4. Verify that 'Remove' button is not displayed:
            await textLine.waitForRemoveButtonNotDisplayed();
            //5. Verify that the content is valid:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('textline_wizard_1');
            assert.isFalse(result, "Textline content should be valid because the single input is not required");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN existing TextLine-content (0:1) is opened WHEN text has been typed and Save button has been pressed THEN text should be saved`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open wizard for new textline:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_0_1);
            //2. Type a text
            await textLine.typeText(TEXT);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            let result = await textLine.getTexLineValues();
            assert.equal(result[0], TEXT, "Expected text should be saved");
        });

    it(`GIVEN existing TextLine-content (0:1) is opened WHEN the previous version has been reverted THEN the textline gets empty`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Open existing text-line content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_0_1);
            //2. Verify the text in the input:
            let result1 = await textLine.getTexLineValues();
            assert.equal(result1[0], TEXT, "Expected text should be saved");
            //3. Open Versions Panel
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            //4. Revert the previous version:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRevertButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot("textline_0_1_reverted");
            let result2 = await textLine.getTexLineValues();
            assert.equal(result2[0], "", "Textline should be cleared");
        });

    it(`GIVEN wizard for new TextLine-content (1:0) is opened WHEN display name has been typed THEN the content remains not valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open wizard for new textline:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_1_0);
            //2. Type a name
            await contentWizard.typeDisplayName(TEXTLINE_1_0);
            //3. Verify that 'Add' button is displayed:
            await textLine.waitForAddButtonDisplayed();
            //4. Verify that 'Remove' button is not displayed:
            await textLine.waitForRemoveButtonNotDisplayed();
            //5. Verify that the content is not valid:
            let result = await contentWizard.isContentInvalid();
            studioUtils.saveScreenshot('textline_wizard_1_0');
            assert.isTrue(result, "Textline content should be not valid because Min 1 valid occurrence(s) required");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`WHEN existing TextLine-content (1:0) is opened THEN form validation message should be displayed`,
        async () => {
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_0);
            //2. Verify that the form validation message is visible:
            let result = await textLine.getFormValidationRecording(0);
            await studioUtils.saveScreenshot('textline_1_0_not_valid');
            assert.equal(result, "Min 1 valid occurrence(s) required", 'Validation recording should be displayed');
        });

    it(`GIVEN existing TextLine-content (1:0) is opened WHEN required text has been typed THEN form validation message should not be be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_0);
            await textLine.typeText("test text");
            //2. Verify the form validation message is not visible:
            await studioUtils.saveScreenshot('textline_1_0_valid');
            await textLine.waitForFormValidationRecordingNotDisplayed(0);
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "Content should be valid, because the required input is filled in");

        });
    it(`GIVEN existing TextLine-content (1:0) is opened WHEN required text has been typed AND saved THEN form validation message should not be be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_0);
            //2. Save the text
            await textLine.typeText(TEXT_2);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //3. Verify that the form validation message is not visible
            await studioUtils.saveScreenshot('textline_1_0_valid_2');
            await textLine.waitForFormValidationRecordingNotDisplayed(0);
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "Content should be valid, because the required input is filled in");
        });

    it(`GIVEN existing TextLine-content (1:0) is opened WHEN 'Add' button been clicked THEN the content remains valid(one required input)`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_0);
            //2. Click on 'Add' button then click on Save
            await textLine.clickOnAddButton();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //Verify that Add button remains visible
            await textLine.waitForAddButtonDisplayed();
            //3. Verify that the form validation message is not visible
            await studioUtils.saveScreenshot('textline_1_0_valid_3');
            await textLine.waitForFormValidationRecordingNotDisplayed(0);
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "Content should be valid, because the required input is filled in");
        });

    it(`GIVEN existing TextLine-content (1:0) is opened WHEN type a text in the second textline THEN expected values should be saved`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_0);
            //2. Type a text in the second texline then click on Save
            await textLine.typeText(TEXT_3, 1);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //3. Verify saved values in both inputs
            await studioUtils.saveScreenshot('textline_1_0_valid_4');
            let result = await textLine.getTexLineValues();
            assert.isTrue(result.includes(TEXT_2), "Expected text should be in the first texline");
            assert.isTrue(result.includes(TEXT_3), "Expected text should be in the second textline");
        });

    it(`GIVEN wizard for new  TextLine-content (1:1) is opened WHEN display name has been typed and saved THEN content should be not valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open wizard for new textline:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TEXTLINE_1_1);
            //2. Type a name
            await contentWizard.typeDisplayName(TEXTLINE_1_1);
            //3. Verify that 'Add' button is not displayed:
            await textLine.waitForAddButtonNotDisplayed();
            //4. Verify that 'Remove' button is not displayed:
            await textLine.waitForRemoveButtonNotDisplayed();
            //5. Verify that the content is not valid:
            let result = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('textline_wizard_1_1');
            assert.isTrue(result, "Textline content should be not valid because 'This field is required'");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN existing TextLine-content (1:1) is opened WHEN text has been saved in the required textline input THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_1);
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Textline content should be not valid because 'This field is required'");
            let formMessage = await textLine.getFormValidationRecording();
            assert.equal(formMessage, appConst.THIS_FIELD_IS_REQUIRED, "'This field is required' should be displayed in the form");
            //2. Type a text in the second texline then click on Save
            await textLine.typeText(TEXT);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForScheduleFormNotVisible();
            //3. Verify saved value
            await studioUtils.saveScreenshot('textline_1_1_valid');
            let result = await textLine.getTexLineValues();
            assert.equal(result[0], TEXT, "Expected text should be in the first texline");
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
