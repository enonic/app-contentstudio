/**
 * Created on 26.08.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const TextLine = require('../../page_objects/wizardpanel/textline.form.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('occurrences.textline0_1.spec: tests for textline 0-1 and textline 1-0', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const TEXT = "test text";
    let SITE;
    const TEXTLINE_0_1 = contentBuilder.generateRandomName('textline');
    const TEXTLINE_1_0 = contentBuilder.generateRandomName('textline');


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new TextLine-content (0:1) is opened WHEN display name has been typed THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open wizard for new textline:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_0_1);
            //2. Type a name
            await contentWizard.typeDisplayName(TEXTLINE_0_1);
            //3. Verify that 'Add' button is not displayed:
            await textLine.waitForAddButtonNotDisplayed();
            //4. Verify that 'Remove' button is not displayed:
            await textLine.waitForRemoveButtonNotDisplayed();
            //5. Verify that the content is valid:
            let result = await contentWizard.isContentInvalid();
            studioUtils.saveScreenshot('textline_wizard_1');
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
            //1. Open existing textline:
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
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.TEXTLINE_1_0);
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
            let contentWizard = new ContentWizard();
            let textLine = new TextLine();
            //1. Open existing textline content:
            await studioUtils.selectAndOpenContentInWizard(TEXTLINE_1_0);
            //2. Verify the form validation message
            let result = await textLine.getFormValidationRecording(0);
            await studioUtils.saveScreenshot('textarea_max_length_1');
            assert.equal(result, "Min 1 valid occurrence(s) required", 'Validation recording should be displayed');
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
