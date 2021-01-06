/**
 * Created on 10.10.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ConfirmationMask = require('../../page_objects/confirmation.mask');

describe('Shortcut parameters specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const PARAM_NAME = "param 1";
    const PARAM_VALUE = "value 1";
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');

    it(`WHEN shortcut-wizard is opened THEN 'Add Parameter' button should be present`,
        async () => {
            let shortcutForm = new ShortcutForm();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            let result = await shortcutForm.waitForAddParametersButtonVisible();
            assert.isTrue(result, "Add Parameters button should be visible");
        });

    it(`GIVEN required data is typed in the wizard AND 'Add Parameters' button has been clicked WHEN 'Save' button has been pressed THEN the shortcut gets not valid because parameter's inputs are empty`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('shortcut'));
            //select the target:
            await shortcutForm.filterOptionsAndSelectTarget('whale');
            //Click on Add Parameter button:
            await shortcutForm.clickOnAddParametersButton();
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot("shortcut_parameter_added_empty");
            // "red icon" should appear, because the content gets not valid:
            await contentWizard.waitUntilInvalidIconAppears();
        });

    it(`GIVEN shortcut-wizard is opened WHEN 'Add Parameters' button has been clicked THEN 2 inputs should appear AND 'Collapse' link gets visible`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            //1. Open new shortcut wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            await shortcutForm.filterOptionsAndSelectTarget('whale');
            //2. Click on Add Parameter button:
            await shortcutForm.clickOnAddParametersButton();
            //"Add Parameters" button should be visible"
            await shortcutForm.waitForAddParametersButtonVisible();

            //'Collapse bottom' link gets visible:
            await shortcutForm.waitForCollapseBottomLinkVisible();
            //"Add Parameters" button should be visible
            await shortcutForm.waitForParametersFormVisible();
            //Save this shortcut with the parameter:
            await shortcutForm.typeParameterName(PARAM_NAME);
            await shortcutForm.typeParameterValue(PARAM_VALUE);
            studioUtils.saveScreenshot("shortcut_parameter_saved");
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

    it(`GIVEN existing shortcut with parameters is opened WHEN the parameter has been removed THEN 'Add Parameters' button should appear`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let confirmationMask = new ConfirmationMask();
            //1. Open existing shortcut(parameter is added)
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            //2. Expand the menu and click on Delete menu item the parameter and confirm it:
            await shortcutForm.expandParameterMenuAndClickOnDelete(0);
            await confirmationMask.clickOnConfirmButton("Delete Parameters");
            //3. Save the content:
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot("shortcut_parameter_removed");
            //4. "parameters form" gets not visible:
            await shortcutForm.waitForParametersFormNotVisible();
            //5. Add Parameters button should be visible:
            await shortcutForm.waitForAddParametersButtonVisible();
        });

    it(`GIVEN existing shortcut is opened(parameter is removed) WHEN revert the previous version THEN expected parameter should appear`,
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // Open existing shortcut:
            await studioUtils.selectContentAndOpenWizard(SHORTCUT_NAME);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            await wizardVersionsWidget.waitForVersionsLoaded();
            //Expand the previous version:
            await wizardVersionsWidget.clickAndExpandVersion(1);

            studioUtils.saveScreenshot("shortcut_version_selected");
            //Click on 'Revert' button:
            await wizardVersionsWidget.clickOnRevertButton();
            studioUtils.saveScreenshot("shortcut_parameter_version_rollback");
            let paramName = await shortcutForm.getParameterName();
            assert.equal(paramName, PARAM_NAME, "Expected parameter should appear");
            let value = await shortcutForm.getParameterValue();
            assert.equal(value, PARAM_VALUE, "Expected value of the parameter should be present");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
