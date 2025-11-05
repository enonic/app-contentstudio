/**
 * Created on 04.10.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const MixinsHtmlArea = require('../../page_objects/wizardpanel/wizard-step-form/mixins.htmlarea.wizard.step.form');
const MixinsTextArea = require('../../page_objects/wizardpanel/wizard-step-form/mixins.textarea.wizard.step.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe('content.mixins.textarea.spec:  enable/disable mixins with textarea(htmlarea), type a text in the textarea`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const DOUBLE_0_1_CONTENT = contentBuilder.generateRandomName('double');
    const DOUBLE_0_0_CONTENT = contentBuilder.generateRandomName('double');
    const TEST_TEXT = 'test text';
    const HTML_AREA_MIXINS_NAME = appConst.MIXINS_NAME.HTML_AREA_MIXINS_NAME;
    const TEXT_AREA_MIXINS_NAME = appConst.MIXINS_NAME.TEXT_AREA_MIXINS_NAME;
    const IMAGE_MIXINS_NAME = appConst.MIXINS_NAME.IMAGE_MIXINS_NAME;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/487
    // Inactive optional mixins should not be visible in the Content Wizard navigation bar
    it(`WHEN site with optional mixins has been opened THEN wizard-step for the mixins should not be present on the navigation bar`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isDisplayed = await contentWizard.isWizardStepPresent(HTML_AREA_MIXINS_NAME);
            assert.ok(isDisplayed === false, 'Inactive optional mixins should not be visible in the Content Wizard navigation bar');
        });

    // verifies:
    // 1) https://github.com/enonic/app-contentstudio/issues/2928
    // Optional mixins gets instantly validated #2928
    // 2) Error message should not be shown before new mixins form is validated #3178
    it(`GIVEN 'Text Area mixins' has been added in the wizard WHEN the site is not saved yet THEN mixins should be visible in the Content Wizard navigation bar AND validation message should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let MixinsHtmlArea = new MixinsHtmlArea();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // Click on '+' icon and add the mixins('Html Area mixins'):
            await contentWizard.clickOnMixinsTogglerByName(HTML_AREA_MIXINS_NAME);
            let isDisplayed = await contentWizard.isWizardStepPresent(HTML_AREA_MIXINS_NAME);
            assert.ok(isDisplayed, 'optional mixins should be visible in the Content Wizard navigation bar');
            // Verify that 'This field is required' is not displayed before saving this content:
            await MixinsHtmlArea.waitForFormValidationRecordingNotDisplayed();
            // Verify that red border is not displayed in mixins form
            await MixinsHtmlArea.waitForMixinsRedBorderNotDisplayed();
        });

    // verifies "https://github.com/enonic/app-contentstudio/issues/467" (Incorrect validation inside mixins with ItemSet and htmlArea)
    it(`GIVEN existing site is opened WHEN 'Text Area mixins' (required) has been added in the wizard AND 'Save' button pressed THEN content gets invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsHtmlArea = new MixinsHtmlArea();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Add mixins with required htmlArea -  Click on '+' icon and enable the mixins ('Html Area mixins'):
            await contentWizard.clickOnMixinsTogglerByName(HTML_AREA_MIXINS_NAME);
            // 3. the site has been saved:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_required_htmlarea_empty');
            // 4. Verify that Red icon appears in the site-wizard, because required html-area in mixins is empty
            await contentWizard.waitUntilInvalidIconAppears();
            // 5. Verify that 'This field is required' message appears in the mixins form:
            await mixinsHtmlArea.waitForFormValidationRecordingDisplayed();
        });

    it(`GIVEN existing site with optional mixins(required html-area) WHEN text has been typed in mixins (required htmlarea) AND 'Save' button pressed THEN content is getting valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsHtmlArea = new MixinsHtmlArea();
            // 1. Open the existing site with added mixins:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Insert a text to the required htmlarea:
            await mixinsHtmlArea.typeTextInHtmlArea('Hello World');
            // 3. site has been saved
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_required_htmlarea_filled');
            // 4. Verify - Red icon disappears in the site-wizard, because required html-area in mixins is filled
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    // verifies the https://github.com/enonic/lib-admin-ui/issues/778 (mixins should be disabled after the version rollback)
    it(`GIVEN existing site with active mixins WHEN the version disabled mixins has been restored THEN mixins form is getting not active`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let versionsWidget = new WizardVersionsWidget();
            // 1. Open existing site, then open details panel:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.openContextWindow();
            // 2. Open versions widget
            await wizardContextPanel.openVersionHistory();
            await versionsWidget.waitForVersionsLoaded();
            // 3. Revert the version with disabled mixins:
            await versionsWidget.clickAndExpandVersion(2);
            await versionsWidget.clickOnRestoreButton();
            await versionsWidget.pause(2000);
            // 4. Verify that mixins step gets not visible:
            await studioUtils.saveScreenshot('site_mixins_rollback_test');
            let isNotVisible = await contentWizard.waitForWizardStepByTitleNotVisible(HTML_AREA_MIXINS_NAME);
            assert.ok(isNotVisible, 'mixins step should be not visible in the navigation bar, because mixins was disabled');
        });
    // verifies Incorrect order of mixins in Content Wizard(xp/issues/6728)
    // mixins forms in the Content Wizard - should follow the same order in which they are included in the XML schema
    it(`WHEN wizard for new content with 3 optional mixins is opened THEN expected order of mixins forms should be present in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Content with optional two mixins is opened
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double0_1');
            await contentWizard.typeDisplayName(DOUBLE_0_1_CONTENT);
            await contentWizard.waitForMixinsTogglerVisible(TEXT_AREA_MIXINS_NAME);
            // 2. Verify the order of titles of mixins in the wizard:
            let result = await contentWizard.getMixinsTitles();
            assert.ok(result.includes(TEXT_AREA_MIXINS_NAME), 'Text Area mixins should be present');
            assert.ok(result.includes(IMAGE_MIXINS_NAME), 'mixins (image selector) should be present');
            assert.ok(result.includes(HTML_AREA_MIXINS_NAME), 'Html Area mixins should be present');
        });

    it(`GIVEN wizard for new content is opened AND 'Text Area mixins'- toggler has been clicked WHEN Save button has been pressed THEN validation error message should appear in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsTextArea = new MixinsTextArea();
            // 1. Open the wizard and type a name:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_0);
            await contentWizard.typeDisplayName(appConst.generateRandomName('atest'));
            // 2. Do enable the mixins:
            await contentWizard.clickOnMixinsTogglerByName(TEXT_AREA_MIXINS_NAME);
            // 3. Save the content:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_textarea_required_validation_message');
            // 4. Validation error message should be displayed in the mixins form:
            let message = await mixinsTextArea.getValidationRecord();
            assert.equal(message, 'This field is required', 'This field is required - Expected validation message should be displayed');
        });

    it(`GIVEN new wizard for content with optional mixins(textarea) is opened WHEN mixins toggler has been clicked AND the content has been saved THEN red invalid-icon should appear in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsTextArea = new MixinsTextArea();
            // 1. Open wizard for new content with optional textarea-mixins:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_0_0);
            await contentWizard.typeDisplayName(DOUBLE_0_0_CONTENT);
            // 2. add the mixins (Click on '+' icon):
            await contentWizard.clickOnMixinsTogglerByName('Text Area mixins');
            // 3. Save the content:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_enabled_textarea_invalid_icon_in_wizard');
            // 4. 'mixins form' should appear and text area gets visible
            await mixinsTextArea.waitForTextAreaVisible();
            // 5. Verify: 'Red icon gets visible in the wizard, because text-area is required for the mixins'
            await contentWizard.waitUntilInvalidIconAppears();
        });

    it(`GIVEN existing invalid content with enabled mixins(empty) is opened WHEN mixins toggler has been clicked(mixins has been disabled) THEN mixins form gets hidden and content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsTextArea = new MixinsTextArea();
            // 1. Open the existing content with enabled mixins:
            await studioUtils.selectContentAndOpenWizard(DOUBLE_0_0_CONTENT);
            await studioUtils.saveScreenshot('mixins-before-disabling');
            // 2. Disable the mixins and save the content:
            await contentWizard.clickOnMixinsTogglerByName(TEXT_AREA_MIXINS_NAME);
            await studioUtils.saveScreenshot('mixins-after-disabling');
            await contentWizard.waitAndClickOnSave();
            // 3. 'text area' gets hidden
            await mixinsTextArea.waitForTextAreaNotVisible();
            // 4. Verify that 'red icon' should not be displayed in the wizard, because mixins is disabled now and the content is valid:
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN existing valid content with disabled mixins is opened WHEN mixins has been enabled AND a text has been inserted in textArea THEN content should be valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsTextArea = new MixinsTextArea();
            await studioUtils.selectContentAndOpenWizard(DOUBLE_0_0_CONTENT);
            // 1. Enable mixins:
            await contentWizard.clickOnMixinsTogglerByName(TEXT_AREA_MIXINS_NAME);
            // 2. Type the text in mixins:
            await mixinsTextArea.typeText(TEST_TEXT);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_text_filled_in_textarea');
            // 3. 'Red icon should not be present in the wizard, because required text-area in mixins is not empty'
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    it(`GIVEN textarea-mixins(with a text) has been disabled AND content saved WHEN mixins toggler has been clicked THEN text-area in mixins should be cleared`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsTextArea = new MixinsTextArea();
            await studioUtils.selectContentAndOpenWizard(DOUBLE_0_0_CONTENT);
            // 1. mixins form has been disabled(click on the toggler):
            await contentWizard.clickOnMixinsTogglerByName(TEXT_AREA_MIXINS_NAME);
            await contentWizard.waitAndClickOnSave();
            // 2. mixins form has been enabled again
            await contentWizard.clickOnMixinsTogglerByName(TEXT_AREA_MIXINS_NAME);
            let result = await mixinsTextArea.getTextInTextArea();
            await studioUtils.saveScreenshot('mixins_textarea_should_be_cleared');
            assert.ok(result === '', 'text-area in the mixins should be cleared');
            // 2. Red icon should be present in the wizard, because text-area is required input
            await contentWizard.waitUntilInvalidIconAppears();
        });

    // verifies the https://github.com/enonic/lib-admin-ui/issues/778
    it(`GIVEN existing content with mixins(required text area) is opened WHEN version of the content with a text in mixins has been reverted THEN expected text should appear in the area`,
        async () => {
            let contentWizard = new ContentWizard();
            let versionsWidget = new WizardVersionsWidget();
            let mixinsTextArea = new MixinsTextArea();
            let wizardContextPanel = new WizardContextPanel();
            await studioUtils.selectContentAndOpenWizard(DOUBLE_0_0_CONTENT);
            // 1. Open details panel:
            await contentWizard.openContextWindow();
            // 2. Open versions widget:
            await wizardContextPanel.openVersionHistory();
            await versionsWidget.clickAndExpandVersion(1);
            // 3. Revert the previous version:
            await versionsWidget.clickOnRestoreButton();
            await versionsWidget.pause(2000);
            // 4. Verify the reverted text:
            await studioUtils.saveScreenshot('mixins_text_in_textarea_restored');
            let result = await mixinsTextArea.getTextInTextArea();
            assert.equal(result, TEST_TEXT, 'Required text should appear in the textarea in mixins');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
