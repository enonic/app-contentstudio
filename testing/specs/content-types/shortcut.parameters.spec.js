/**
 * Created on 10.10.2018. updated on 18.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require('../../libs/content.builder');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ConfirmationMask = require('../../page_objects/confirmation.mask');

describe('Shortcut parameters specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PARAM_NAME = 'param 1';
    const PARAM_VALUE = 'value 1';
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');

    it(`WHEN wizard for new shortcut is opened THEN 'Add Parameters' button and 'HTTP Parameters' help text should be displayed`, async () => {
        let shortcutForm = new ShortcutForm();
        let contentWizard = new ContentWizard();
        // 1. Open the wizard:
        await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
        let isDisplayed = await shortcutForm.waitForAddParametersButtonDisplayed();
        assert.ok(isDisplayed, "'Add Parameters' button should be visible");
        // 2. Verify that expected help text is displayed in the parameters form:
        let actualHelpText = await shortcutForm.getHelpTextsInParametersForm();
        assert.equal(actualHelpText[0], 'HTTP Parameters', 'Expected help message should be displayed');
    });

    it(`GIVEN display name is typed, target is selected AND 'Add Parameters' button has been clicked WHEN 'Save' button has been pressed THEN the shortcut gets invalid because the parameter's inputs are empty`, async () => {
        let shortcutForm = new ShortcutForm();
        let contentWizard = new ContentWizard();
        await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
        await contentWizard.typeDisplayName(contentBuilder.generateRandomName('shortcut'));
        // select the target:
        await shortcutForm.filterOptionsAndSelectTarget('whale');
        // Click on Add Parameter button:
        await shortcutForm.clickOnAddParametersButton();
        await contentWizard.waitAndClickOnSave();
        await studioUtils.saveScreenshot('shortcut_parameter_added_empty');
        // "red icon" should appear, because the content gets invalid:
        await contentWizard.waitUntilInvalidIconAppears();
    });

    it(`GIVEN new shortcut-wizard is opened AND 'Add Parameters' button has been clicked WHEN parameter's name and value have been typed THEN the shortcut with the parameter should be saved`, async () => {
        let shortcutForm = new ShortcutForm();
        let contentWizard = new ContentWizard();
        //1. Open new shortcut wizard:
        await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
        await contentWizard.typeDisplayName(SHORTCUT_NAME);
        await shortcutForm.filterOptionsAndSelectTarget('whale');
        // 2. Click on Add Parameter button:
        await shortcutForm.clickOnAddParametersButton();
        // 3. 'Add Parameters' button remains visible:
        await shortcutForm.waitForAddParametersButtonDisplayed();
        // 4. Parameters form should be visible:
        await shortcutForm.waitForParametersFormVisible();
        // 5. Save this shortcut with the parameter:
        await shortcutForm.typeParameterName(PARAM_NAME);
        await shortcutForm.typeParameterValue(PARAM_VALUE);
        await studioUtils.saveScreenshot('shortcut_parameter_saved');
        await contentWizard.waitAndClickOnSave();
    });

    it(`WHEN existing shortcut with a parameter is opened THEN expected name and value of the parameter should be displayed`, async () => {
        let shortcutForm = new ShortcutForm();
        await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
        let result = await shortcutForm.getParameterName();
        assert.equal(result, PARAM_NAME, 'Expected parameter should be present');
        result = await shortcutForm.getParameterValue();
        assert.equal(result, PARAM_VALUE, 'Expected value of the parameter should be present');
    });

    it("GIVEN existing shortcut with a parameter is opened WHEN 'Add Parameters' button has been clicked THEN 'Expand all' button gets visible", async () => {
        let shortcutForm = new ShortcutForm();
        // 1. Open existing shortcut content:
        await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
        // 2. Click on 'Add Parameters' button:
        await shortcutForm.clickOnAddParametersButton();
        // 3. Verify that 'Expand all' link gets visible:
        await shortcutForm.waitForExpandAllButtonDisplayed();
    });

    it(`GIVEN existing shortcut with a parameter is opened WHEN the parameter has been deleted AND the content has been saved THEN parameters form gets not visible AND 'Add Parameters' button should be displayed`, async () => {
        let shortcutForm = new ShortcutForm();
        let contentWizard = new ContentWizard();
        let confirmationMask = new ConfirmationMask();
        // 1. Open existing shortcut(parameter is added)
        await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
        // 2. Expand the parameter's menu, click on 'Delete' menu item and confirm the deletion:
        await shortcutForm.expandParameterMenuAndClickOnDelete(0);
        await confirmationMask.clickOnDeleteButton();
        await confirmationMask.waitForDialogClosed();
        // 3. Save the content:
        await contentWizard.waitAndClickOnSave();
        await studioUtils.saveScreenshot('shortcut_parameter_removed');
        // 4. 'parameters form' gets not visible:
        await shortcutForm.waitForParametersFormNotVisible();
        // 5. Add Parameters button should be visible:
        await shortcutForm.waitForAddParametersButtonDisplayed();
    });

    it(`GIVEN existing shortcut is opened(parameter is deleted) WHEN the previous version has been restored THEN the parameter with expected name and value should appear`, async () => {
        let shortcutForm = new ShortcutForm();
        let contentWizard = new ContentWizard();
        let wizardVersionsWidget = new WizardVersionsWidget();
        let wizardContextPanel = new WizardContextPanel();
        // Open existing shortcut:
        await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
        await contentWizard.openContextWindow();
        await wizardContextPanel.openVersionHistory();
        await wizardVersionsWidget.waitForLoaded();
        // Expand the previous version:
        await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
        await studioUtils.saveScreenshot('shortcut_version_selected');
        // Click on 'Restore' button:
        await wizardVersionsWidget.clickOnRestoreButton();
        await studioUtils.saveScreenshot('shortcut_parameter_version_reverted_1');
        // The expanded parameter form should appear with the expected parameter and value:
        await studioUtils.saveScreenshot('shortcut_parameter_version_reverted_2');
        let paramName = await shortcutForm.getParameterName();
        assert.equal(paramName, PARAM_NAME, 'Expected parameter should appear');
        let value = await shortcutForm.getParameterValue();
        assert.equal(value, PARAM_VALUE, 'Expected value of the parameter should be present');
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
