/**
 * Created on 04.10.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const XDataHtmlArea = require('../page_objects/wizardpanel/xdata.htmlarea.wizard.step.form');
const XDataTextArea = require('../page_objects/wizardpanel/xdata.textarea.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');

describe('content.xdata.textarea.spec:  enable/disable x-data with textarea(htmlarea), type a text in the textarea`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let contentName = contentBuilder.generateRandomName('test');
    let TEST_TEXT = 'test text';
    let X_DATA_STEP_WIZARD = 'Html Area x-data';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/487
    //Inactive optional x-data should not be visible in the Content Wizard navigation bar
    it(`WHEN site with optional x-data has been opened THEN step for the x-data  should not be present on the navigation bar`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isDisplayed = await contentWizard.waitForWizardStepPresent(X_DATA_STEP_WIZARD);
            assert.isFalse(isDisplayed, 'Inactive optional x-data should not be visible in the Content Wizard navigation bar');
        });

    // verifies:
    //1) https://github.com/enonic/app-contentstudio/issues/2928
    //Optional X-data gets instantly validated #2928
    //2) Error message should not be shown before new X-data form is validated #3178
    it(`GIVEN site with optional x-data is opened WHEN x-data has been activated THEN x-data should be visible in the Content Wizard navigation bar`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataHtmlArea = new XDataHtmlArea();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //Click on '+' icon and enable the x-data:
            await contentWizard.clickOnXdataToggler();
            let isDisplayed = await contentWizard.waitForWizardStepPresent(X_DATA_STEP_WIZARD);
            assert.isTrue(isDisplayed, 'optional x-data should be visible in the Content Wizard navigation bar');
            //Verify that 'This field is required' is not displayed before saving this content:
            await xDataHtmlArea.waitForFormValidationRecordingNotDisplayed();
            //Verify that red border is not displayed in x-data form
            await xDataHtmlArea.waitForXdataRedBorderNotDisplayed();
        });

    //verifies "https://github.com/enonic/app-contentstudio/issues/467" (Incorrect validation inside X-data with ItemSet and htmlArea)
    it(`GIVEN existing site with optional x-data(required html-area) WHEN x-data has been activated AND Save button pressed THEN content is getting invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataHtmlArea = new XDataHtmlArea();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //Click on '+' icon and enable the x-data:
            await contentWizard.clickOnXdataToggler();
            //site has been saved:
            await contentWizard.waitAndClickOnSave();
            //Red icon appears in the site-wizard, because required html-area in x-data is empty
            await contentWizard.waitUntilInvalidIconAppears();
            await xDataHtmlArea.waitForFormValidationRecordingDisplayed();
        });

    it(`GIVEN existing site with optional x-data(required html-area) WHEN text has been typed in x-data (required htmlarea) AND Save button pressed THEN content is getting valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataHtmlArea = new XDataHtmlArea();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // text typed in x-data(htmlarea)
            await xDataHtmlArea.typeTextInHtmlArea("Hello World");
            //site has been saved
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('xdata_required_htmlarea_filled');
            //Red icon disappears in the site-wizard, because required html-area in x-data is filled
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    //verifies the https://github.com/enonic/lib-admin-ui/issues/778 (x-data should be disabled after the version rollback)
    it(`GIVEN existing site with active x-data WHEN the version disabled x-data has been restored THEN x-data form is getting not active`,
        async () => {
            let contentWizard = new ContentWizard();
            let detailsPanel = new WizardDetailsPanel();
            let versionsWidget = new WizardVersionsWidget();
            //1. Open existing site, then open details panel:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.openDetailsPanel();
            //2. Open versions widget
            await detailsPanel.openVersionHistory();
            await versionsWidget.waitForVersionsLoaded();
            //3. Revert the version with disabled x-data:
            await versionsWidget.clickAndExpandVersion(2);
            await versionsWidget.clickOnRevertButton();
            await versionsWidget.pause(2000);
            //4. Verify that x-data step gets not visible:
            studioUtils.saveScreenshot("site_x_data_rollback_test");
            let isNotVisible = await contentWizard.waitForWizardStepByTitleNotVisible(X_DATA_STEP_WIZARD);
            assert.isTrue(isNotVisible, 'x-data step should be not visible in the navigation bar, because x-data was disabled');
        });
    //verifies Incorrect order of x-data in Content Wizard(xp/issues/6728)
    //x-data forms in the Content Wizard - should follow the same order in which they are included in the XML schema
    it(`WHEN content with optional two x-data is opened THEN expected order of x-data forms should be present in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Content with optional two x-data is opened
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double0_1');
            await contentWizard.typeDisplayName(contentName);
            await contentWizard.waitForXdataTogglerVisible();
            //2. Verify the order of titles:
            let result = await contentWizard.getXdataTitles();
            assert.equal(result[0], 'Text Area x-data');
            assert.equal(result[1], 'X-data (image selector)');
            assert.equal(result[2], 'Html Area x-data')
        });

    it(`GIVEN content with optional x-data(textarea) is opened WHEN x-data toggler has been clicked THEN x-data form should be added and text area gets visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataTextArea = new XDataTextArea();
            //1. Open the wizard and type a name:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double0_0');
            await contentWizard.typeDisplayName(contentName);
            //2. Do enable the x-data:
            await contentWizard.waitForXdataTogglerVisible();
            await contentWizard.clickOnXdataToggler();
            //3. Save the content:
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('xdata_enabled_textarea');
            //4. 'x-data form' should appear and text area gets visible
            await xDataTextArea.waitForTextAreaVisible();
            //5. Verify: 'Red icon gets visible in the wizard, because text-area is required input in x-data'
            await contentWizard.waitUntilInvalidIconAppears();
        });

    it(`GIVEN existing content with enabled x-data is opened WHEN x-data toggler has been clicked THEN x-data form gets hidden and content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataTextArea = new XDataTextArea();
            //1. Open existing content with enabled x-data:
            await studioUtils.selectContentAndOpenWizard(contentName);
            studioUtils.saveScreenshot('xdata-before-disabling');
            //2. Disable the x-data and save the content:
            await contentWizard.clickOnXdataToggler();
            studioUtils.saveScreenshot('xdata-after-disabling');
            await contentWizard.waitAndClickOnSave();
            //3. 'text area' gets hidden
            await xDataTextArea.waitForTextAreaNotVisible();
            //4. Verify that 'red icon' should not be displayed in the wizard, because x-data is disabled now and the content is valid:
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN existing content with enabled x-data is opened WHEN text typed in x-data form THEN content is getting valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataTextArea = new XDataTextArea();
            await studioUtils.selectContentAndOpenWizard(contentName);
            //Enable x-data:
            await contentWizard.clickOnXdataToggler();
            //Type the text in x-data:
            await xDataTextArea.typeText(TEST_TEXT);
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('xdata_text_typed');
            //'Red icon should not be present in the wizard, because required text-area in x-data is not empty'
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN x-data(required textarea) with a text AND the x-data has been disabled AND content saved WHEN x-data has been enabled again THEN text-area in x-data should be cleared`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataTextArea = new XDataTextArea();
            await studioUtils.selectContentAndOpenWizard(contentName);
            //x-data form has been disabled:
            await contentWizard.clickOnXdataToggler();
            await contentWizard.waitAndClickOnSave();
            //x-data form has been enabled again
            await contentWizard.clickOnXdataToggler();
            let result = await xDataTextArea.getTextInTextArea();
            studioUtils.saveScreenshot('xdata_textarea_should_be_cleared');
            assert.isTrue(result == '', 'text-area in the x-data should be cleared');
            //Red icon should be present in the wizard, because text-area is required input
            await contentWizard.waitUntilInvalidIconAppears();
        });

    //verifies the https://github.com/enonic/lib-admin-ui/issues/778
    it(`GIVEN existing content with x-data(required text area) is opened WHEN version of the content with a text in x-data has been reverted THEN expected text should appear in the area`,
        async () => {
            let contentWizard = new ContentWizard();
            let versionsWidget = new WizardVersionsWidget();
            let xDataTextArea = new XDataTextArea();
            let detailsPanel = new WizardDetailsPanel();
            await studioUtils.selectContentAndOpenWizard(contentName);
            //1. Open details panel:
            await contentWizard.openDetailsPanel();
            //2. Open versions widget:
            await detailsPanel.openVersionHistory();
            await versionsWidget.clickAndExpandVersion(1);
            //3. Revert the previous version:
            await versionsWidget.clickOnRevertButton();
            await versionsWidget.pause(2000);
            //4. Verify the reverted text:
            studioUtils.saveScreenshot('xdata_text_in_textarea_restored');
            let result = await xDataTextArea.getTextInTextArea();
            assert.equal(result, TEST_TEXT, 'Required text should appear in the textarea in x-data');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
