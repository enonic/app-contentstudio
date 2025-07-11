/**
 * Created on 10.10.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
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

    it(`WHEN wizard for new shortcut is opened THEN 'Add Parameter' button should be present`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            // 1. Open the wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            let isDisplayed = await shortcutForm.waitForAddParametersButtonDisplayed();
            assert.ok(isDisplayed, "'Add Parameters' button should be visible");
            // 2. Verify that the help text in Parameters form is not visible by default:
            await shortcutForm.waitForHelpTextInParametersFormNotDisplayed();
            // 3. Click on show/hide Help Texts toggler in the WizardStepNavigatorAndToolbar:
            await contentWizard.clickOnHelpTextsToggler();
            // 4. Verify that expected help text gets visible in the shortcut form:
            let actualHelpText = await shortcutForm.getHelpTextsInParametersForm();
            assert.equal(actualHelpText[0], 'HTTP Parameters', 'Expected help message should be displayed');
        });

    it(`GIVEN required data is typed in the wizard AND 'Add Parameters' button has been clicked WHEN 'Save' button has been pressed THEN the shortcut gets not valid because parameter's inputs are empty`,
        async () => {
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

    it(`GIVEN new shortcut-wizard is opened WHEN 'Add Parameters' button has been clicked THEN 2 inputs should appear AND 'Collapse' link gets visible`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            //1. Open new shortcut wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            await shortcutForm.filterOptionsAndSelectTarget('whale');
            // 2. Click on Add Parameter button:
            await shortcutForm.clickOnAddParametersButton();
            // 3. 'Add Parameters' button remains visible"
            await shortcutForm.waitForAddParametersButtonDisplayed();
            // 4. 'Collapse bottom' link gets visible:
            await shortcutForm.waitForCollapseBottomLinkVisible();
            // 5. 'Add Parameters' button should be visible
            await shortcutForm.waitForParametersFormVisible();
            // 6. Save this shortcut with the parameter:
            await shortcutForm.typeParameterName(PARAM_NAME);
            await shortcutForm.typeParameterValue(PARAM_VALUE);
            await studioUtils.saveScreenshot('shortcut_parameter_saved');
            await contentWizard.waitAndClickOnSave();
        });

    it(`WHEN existing shortcut with parameters is opened THEN expected parameter should be displayed`,
        async () => {
            let shortcutForm = new ShortcutForm();
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            let result = await shortcutForm.getParameterName();
            assert.equal(result, PARAM_NAME, "Expected parameter should be present");
            result = await shortcutForm.getParameterValue();
            assert.equal(result, PARAM_VALUE, "Expected value of the parameter should be present");
        });

    it("GIVEN existing shortcut with parameters is opened WHEN 'Collapse' link has been clicked THEN 'Expand' link gets visible",
        async () => {
            let shortcutForm = new ShortcutForm();
            // 1. Open existing shortcut content:
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            // 2. Click on 'Collapse' link and collapse parameters form:
            await shortcutForm.clickOnCollapseBottomLink();
            // 3. Verify that 'Expand' link gets visible now:
            await shortcutForm.waitForExpandLinkVisible();
            // 4. Click on 'Add' button:
            await shortcutForm.clickOnAddParametersButton();
            // 5. Verify that 'Collapse all' link gets visible:
            await shortcutForm.waitForCollapseTopLinkVisible();
        });

    it(`GIVEN existing shortcut with parameters is opened WHEN the parameter has been removed THEN 'Add Parameters' button should appear`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let confirmationMask = new ConfirmationMask();
            // 1. Open existing shortcut(parameter is added)
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            // 2. Expand the menu and click on 'Delete' menu item the parameter and confirm it:
            await shortcutForm.expandParameterMenuAndClickOnDelete(0);
            await confirmationMask.clickOnConfirmButton('Delete Parameters');
            // 3. Save the content:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('shortcut_parameter_removed');
            // 4. 'parameters form' gets not visible:
            await shortcutForm.waitForParametersFormNotVisible();
            // 5. Add Parameters button should be visible:
            await shortcutForm.waitForAddParametersButtonDisplayed();
        });

    it(`GIVEN existing shortcut is opened(parameter is removed) WHEN revert the previous version THEN expected parameter should appear`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardContextPanel = new WizardContextPanel();
            // Open existing shortcut:
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            await contentWizard.openDetailsPanel();
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // Expand the previous version:
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await studioUtils.saveScreenshot('shortcut_version_selected');
            // Click on 'Revert' button:
            await wizardVersionsWidget.clickOnRevertButton();
            await studioUtils.saveScreenshot('shortcut_parameter_version_reverted_1');
            //TODO remove the row, when https://github.com/enonic/app-contentstudio/issues/4940 will be fixed ( the issue in backlog)
            await shortcutForm.clickOnParametersForm(0);
            await studioUtils.saveScreenshot('shortcut_parameter_version_reverted_2');
            let paramName = await shortcutForm.getParameterName();
            assert.equal(paramName, PARAM_NAME, 'Expected parameter should appear');
            let value = await shortcutForm.getParameterValue();
            assert.equal(value, PARAM_VALUE, 'Expected value of the parameter should be present');
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
