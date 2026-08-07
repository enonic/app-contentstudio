/**
 * Created on 04.10.2018. updated on 07.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const XDataHtmlArea = require('../../page_objects/wizardpanel/wizard-step-form/xdata.htmlarea.wizard.step.form');
const XDataTextArea = require('../../page_objects/wizardpanel/wizard-step-form/xdata.textarea.wizard.step.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe('content.xdata.textarea.spec:  enable/disable x-data with textarea(htmlarea), type a text in the textarea`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const DOUBLE_0_0_CONTENT = contentBuilder.generateRandomName('double');
    const TEST_TEXT = 'test text';
    const HTML_AREA_X_DATA_NAME = appConst.X_DATA_NAME.HTML_AREA_X_DATA_NAME;
    const TEXT_AREA_X_DATA_NAME = appConst.X_DATA_NAME.TEXT_AREA_X_DATA_NAME;

    it(`Preconditions: new site should be added`, async () => {
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, null, [appConst.APP_CONTENT_TYPES]);
        await studioUtils.doAddSite(SITE);
    });

    it(`GIVEN new wizard for content with optional x-data(textarea) is opened WHEN x-data toggler has been clicked AND the content has been saved THEN red invalid-icon should appear in the wizard`, async () => {
        let contentWizard = new ContentWizard();
        let xDataTextArea = new XDataTextArea();
        // 1. Open wizard for new content with optional textarea-xdata:
        await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_0);
        await contentWizard.typeDisplayName(DOUBLE_0_0_CONTENT);
        // 2. add the x-data (Click on '+' icon):
        await contentWizard.clickOnXdataMenuTrigger();
        await contentWizard.clickOnXdataMenuItemCheckbox(TEXT_AREA_X_DATA_NAME);
        await contentWizard.clickOnConfirmXdataButton();
        // 3. Save the content:
        await contentWizard.waitAndClickOnSave();
        await contentWizard.clickOnWizardStep(TEXT_AREA_X_DATA_NAME);
        await studioUtils.saveScreenshot('xdata_enabled_textarea_invalid_icon_in_wizard');
        // 4. 'x-data form' should appear and text area gets visible
        await xDataTextArea.waitForTextAreaVisible();
        // 5. Verify: 'Red icon gets visible in the wizard, because text-area is required for the x-data'
        await contentWizard.waitUntilInvalidIconAppears();
        await contentWizard.clickOnWizardStep(TEXT_AREA_X_DATA_NAME);
        await xDataTextArea.typeText(TEST_TEXT);
        await contentWizard.waitAndClickOnSave();
        await contentWizard.waitForNotificationMessage();
    });

    it(`GIVEN textarea-xdata(with a text) has been disabled AND content saved WHEN x-data toggler has been clicked THEN text-area in x-data should be cleared`, async () => {
        let contentWizard = new ContentWizard();
        let xDataTextArea = new XDataTextArea();
        await studioUtils.selectContentAndOpenWizard(DOUBLE_0_0_CONTENT);
        // 1. x-data form has been unchecked:
        await contentWizard.clickOnXdataMenuTrigger();
        await contentWizard.clickOnXdataMenuItemCheckbox(TEXT_AREA_X_DATA_NAME);
        await contentWizard.clickOnConfirmXdataButton();

        await contentWizard.waitAndClickOnSave();
        // 2. x-data form has been added again
        await contentWizard.clickOnXdataMenuTrigger();
        await contentWizard.clickOnXdataMenuItemCheckbox(TEXT_AREA_X_DATA_NAME);
        await contentWizard.clickOnConfirmXdataButton();
        await contentWizard.clickOnWizardStep(TEXT_AREA_X_DATA_NAME);
        let result = await xDataTextArea.getTextInTextArea();
        await studioUtils.saveScreenshot('xdata_textarea_should_be_cleared');
        assert.ok(result === '', 'text-area in the x-data should be cleared');
        // 2. Red icon should be present in the wizard, because text-area is required input
        await contentWizard.waitUntilInvalidIconAppears();
    });

    // verifies the https://github.com/enonic/lib-admin-ui/issues/778
    it(`GIVEN existing content with x-data(required text area) is opened WHEN version of the content with a text in x-data has been reverted THEN expected text should appear in the area`, async () => {
        let contentWizard = new ContentWizard();
        let versionsWidget = new WizardVersionsWidget();
        let xDataTextArea = new XDataTextArea();
        let wizardContextPanel = new WizardContextPanel();
        await studioUtils.selectContentAndOpenWizard(DOUBLE_0_0_CONTENT);
        // 1. Open details panel:
        await contentWizard.openContextWindow();
        // 2. Open versions widget:
        await wizardContextPanel.openVersionHistory();
        await versionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
        // 3. Revert the previous version:
        await versionsWidget.clickOnRestoreButton();
        await versionsWidget.pause(2000);
        await contentWizard.clickOnWizardStep(TEXT_AREA_X_DATA_NAME);
        // 4. Verify the reverted text:
        await studioUtils.saveScreenshot('xdata_text_in_textarea_restored');
        let result = await xDataTextArea.getTextInTextArea();
        assert.equal(result, TEST_TEXT, 'Required text should appear in the textarea in x-data');
    });

    // verifies https://github.com/enonic/app-contentstudio/issues/487
    // Inactive optional x-data should not be visible in the Content Wizard navigation bar
    it(`WHEN site with optional x-data has been opened THEN wizard-step for the x-data should not be present on the navigation bar`, async () => {
        let contentWizard = new ContentWizard();
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        let isDisplayed = await contentWizard.isWizardStepPresent(HTML_AREA_X_DATA_NAME);
        assert.ok(
            isDisplayed === false,
            'Inactive optional x-data should not be visible in the Content Wizard navigation bar',
        );
    });

    // verifies:
    // 1) https://github.com/enonic/app-contentstudio/issues/2928
    // Optional X-data gets instantly validated #2928
    // 2) Error message should not be shown before new X-data form is validated #3178
    it(`GIVEN 'Text Area x-data' has been added in the wizard WHEN the site is not saved yet THEN x-data should be visible in the Content Wizard navigation bar AND validation message should not be displayed`, async () => {
        let contentWizard = new ContentWizard();
        let xDataHtmlArea = new XDataHtmlArea();
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        // add the x-data('Html Area x-data'):
        await contentWizard.clickOnXdataMenuTrigger();
        await contentWizard.clickOnXdataMenuItemCheckbox(HTML_AREA_X_DATA_NAME);
        await contentWizard.clickOnConfirmXdataButton();
        let isDisplayed = await contentWizard.isWizardStepPresent(HTML_AREA_X_DATA_NAME);
        assert.ok(isDisplayed, 'optional x-data should be visible in the Content Wizard navigation bar');
        // Verify that 'This field is required' is not displayed before saving this content:
        await xDataHtmlArea.waitForFormValidationRecordingNotDisplayed();
        // Verify that red border is not displayed in x-data form
        await contentWizard.waitForRedIconInTab(HTML_AREA_X_DATA_NAME);
        // the content becomes invalid
        await contentWizard.waitUntilInvalidIconAppears();
        await contentWizard.waitForSaveButtonEnabled();
    });

    // verifies "https://github.com/enonic/app-contentstudio/issues/467" (Incorrect validation inside X-data with ItemSet and htmlArea)
    it(`GIVEN existing site is opened WHEN 'Text Area x-data' (required) has been added in the wizard AND 'Save' button pressed THEN content gets invalid`, async () => {
        let contentWizard = new ContentWizard();
        let xDataHtmlArea = new XDataHtmlArea();
        // 1. Open the existing site:
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        // 2. Add x-data with required htmlArea:
        await contentWizard.clickOnXdataMenuTrigger();
        await contentWizard.clickOnXdataMenuItemCheckbox(HTML_AREA_X_DATA_NAME);
        await contentWizard.clickOnConfirmXdataButton();
        // 3. the site has been saved:
        await contentWizard.waitAndClickOnSave();
        await studioUtils.saveScreenshot('xdata_required_htmlarea_empty');
        // 4. Verify that Red icon appears in the site-wizard, because required html-area in x-data is empty
        await contentWizard.waitUntilInvalidIconAppears();
        // 5. Click on the tab:
        await contentWizard.clickOnWizardStep(HTML_AREA_X_DATA_NAME);
        // 6. Verify that 'This field is required' message appears in the x-data form:
        await xDataHtmlArea.waitForFormValidationRecordingDisplayed();
    });

    it(`GIVEN existing site with optional x-data(required html-area) WHEN text has been typed in x-data (required htmlarea) AND 'Save' button pressed THEN content is getting valid`, async () => {
        let contentWizard = new ContentWizard();
        let xDataHtmlArea = new XDataHtmlArea();
        // 1. Open the existing site with added x-data:
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        await contentWizard.clickOnWizardStep(HTML_AREA_X_DATA_NAME);
        // 2. Insert a text to the required htmlarea:
        await xDataHtmlArea.typeTextInHtmlArea('Hello World');
        // 3. site has been saved
        await contentWizard.waitAndClickOnSave();
        await studioUtils.saveScreenshot('xdata_required_htmlarea_filled');
        // 4. Verify - Red icon disappears in the site-wizard, because required html-area in x-data is filled
        await contentWizard.waitUntilInvalidIconDisappears();
    });

    it(`GIVEN existing site with active x-data WHEN the version disabled x-data has been restored THEN x-data form is getting not active`, async () => {
        let contentWizard = new ContentWizard();
        let wizardContextPanel = new WizardContextPanel();
        let versionsWidget = new WizardVersionsWidget();
        // 1. Open existing site, then open details panel:
        await studioUtils.selectContentAndOpenWizard(SITE.displayName);
        await contentWizard.openContextWindow();
        // 2. Open versions widget
        await wizardContextPanel.openVersionHistory();
        await versionsWidget.waitForLoaded();
        // 3. Revert the version with disabled x-data:
        await versionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 2);
        await versionsWidget.clickOnRestoreButton();
        await versionsWidget.pause(2000);
        // 4. Verify that x-data step gets not visible:
        await studioUtils.saveScreenshot('site_x_data_rollback_test');
        let isNotVisible = await contentWizard.waitForWizardStepByTitleNotVisible(HTML_AREA_X_DATA_NAME);
        assert.ok(isNotVisible, 'x-data step should be not visible in the navigation bar, because x-data was disabled');
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
