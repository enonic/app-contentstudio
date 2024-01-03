/**
 * Created on 17.07.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const LayerWizardPanel = require('../../page_objects/project/layer.wizard.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('layer.in.default.spec - ui-tests for creating a layer in Default project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = appConst.generateRandomName('layer');
    const ROLES_MESSAGE = 'Roles successfully copied from "Default"';
    const LANGUAGE_MESSAGE = 'Language successfully copied from "Default"';
    const ACCESS_MODE_MESSAGE = 'Access mode successfully copied from "Default"';
    const PARENT_DEFAULT = 'Default';

    it("GIVEN new layer has been created in 'Default' project WHEN the layer has been reopened THEN 3 'copy from parent' buttons should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1.Create new layer in the Default project:
            await settingsBrowsePanel.openProjectWizardDialog();
            let layer = projectUtils.buildLayer('Default', null, appConst.PROJECT_ACCESS_MODE.PRIVATE, null, null, LAYER_DISPLAY_NAME, null,
                null);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
            // 2.Click on the layer and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 3. Verify that copy buttons are displayed and disabled:
            await layerWizard.waitForCopyLanguageFromParentDisabled(PARENT_DEFAULT);
            await layerWizard.waitForCopyAccessModeFromParentDisabled(PARENT_DEFAULT);
            await layerWizard.waitForCopyRolesFromParentDisabled(PARENT_DEFAULT);
            // 4. Verify that 'Default' is parent project in the layer:
            let actualParent = await layerWizard.getParentProjectName();
            assert.equal(actualParent, PARENT_DEFAULT, "'Default' project should be parent");
        });

    it("GIVEN existing layer is opened WHEN access mode has been updated THEN 'Copy Access mode from parent' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open exising layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Update the access mode and confirm it:
            await layerWizard.clickOnAccessModeRadio('Public');
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            // 3. Verify that 'copy Access mode from parent' button gets enabled:
            await layerWizard.waitForCopyAccessModeFromParentEnabled(PARENT_DEFAULT);
            // 4. Verify that 'Copy language from parent' and 'copy roles from parent' remain disabled
            await layerWizard.waitForCopyLanguageFromParentDisabled(PARENT_DEFAULT);
            await layerWizard.waitForCopyRolesFromParentDisabled(PARENT_DEFAULT);
        });

    it("GIVEN existing layer is opened WHEN a language has been selected THEN 'Copy language from parent' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1. Open exising layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Select a language:
            await layerWizard.selectLanguage(appConst.LANGUAGES.EN);
            // 3. Verify that 'copy language from parent' button gets enabled:
            await layerWizard.waitForCopyLanguageFromParentEnabled(PARENT_DEFAULT);
            // 4. Verify that 2 buttons remain disabled:
            await layerWizard.waitForCopyAccessModeFromParentDisabled(PARENT_DEFAULT);
            await layerWizard.waitForCopyRolesFromParentDisabled(PARENT_DEFAULT);
        });

    it("GIVEN existing layer is opened WHEN an item in Roles has been selected THEN 'Copy roles from parent' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1. Open exising layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Add 'SU' in access roles selector:
            await layerWizard.selectProjectAccessRoles(appConst.systemUsersDisplayName.SUPER_USER);
            // 3. Verify that copy roles button gets enabled:
            await layerWizard.waitForCopyRolesFromParentEnabled(PARENT_DEFAULT);
            // 4. Verify that 2 buttons remain disabled:
            await layerWizard.waitForCopyLanguageFromParentDisabled(PARENT_DEFAULT);
            await layerWizard.waitForCopyAccessModeFromParentDisabled(PARENT_DEFAULT);
        });

    it("GIVEN new item has been added in Roles selector WHEN 'Copy roles from parent' has been clicked THEN 'Copy roles from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1. Open exising layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Add SU in access roles selector:
            await layerWizard.selectProjectAccessRoles(appConst.systemUsersDisplayName.SUPER_USER);
            // 3. Verify that copy roles button gets enabled:
            await layerWizard.waitForCopyRolesFromParentEnabled(PARENT_DEFAULT);
            // 4. Click on 'Copy roles from parent':
            await layerWizard.clickOnCopyRolesFromParent(PARENT_DEFAULT);
            // 5. Verify that notification message appears
            let message = await layerWizard.waitForNotificationMessage();
            assert.equal(message, ROLES_MESSAGE, "Roles successfully copied from Default - message should appear");
            // 6. Verify that 'Copy roles from parent' gets disabled
            await layerWizard.waitForCopyRolesFromParentDisabled(PARENT_DEFAULT);
        });

    it("GIVEN a language is selected in layer-wizard WHEN 'Copy language' button has been pressed THEN 'Copy language from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1. Open exising layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Select a language:
            await layerWizard.selectLanguage(appConst.LANGUAGES.EN);
            // 3. Click on 'Copy language from parent':
            await layerWizard.clickOnCopyLanguageFromParent(PARENT_DEFAULT);
            await studioUtils.saveScreenshot("copy_language_from_parent");
            // 4. Verify that notification message appears:
            let message = await layerWizard.waitForNotificationMessage();
            assert.equal(message, LANGUAGE_MESSAGE, 'Message should be - Language successfully copied from "Default"');
            // 5. Verify that 'Copy language from parent' button gets disabled:
            await layerWizard.waitForCopyLanguageFromParentDisabled(PARENT_DEFAULT);
            // 6. Verify that locale options filter gets visible and enabled:
            let isClickable = await layerWizard.isLocaleOptionsFilterInputClickable();
            assert.isTrue(isClickable, "locale options filter gets visible and enabled");
        });

    it("GIVEN 'Public access mode' is updated in layer wizard WHEN 'Copy Access Mode from parent' button has been pressed THEN 'Copy access mode from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open exising layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Update the access mode:
            await layerWizard.clickOnAccessModeRadio('Public');
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            // 3. Click on 'Copy access mode from parent':
            await layerWizard.clickOnCopyAccessModeFromParent(PARENT_DEFAULT);
            // 4. Verify that Confirmation dialog is loaded:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await studioUtils.saveScreenshot('copy_access_mode_from_parent');
            let message = await layerWizard.waitForNotificationMessage();
            assert.equal(message, ACCESS_MODE_MESSAGE, 'Message should be - Access mode successfully copied from "Default"');
            // 5. Verify that 'Copy access mode from parent' button gets disabled:
            await layerWizard.waitForCopyAccessModeFromParentDisabled(PARENT_DEFAULT);
            // 6. Verify that access mode changed to 'Private':
            let isSelected = await layerWizard.isAccessModeRadioSelected('Private');
            assert.isTrue(isSelected, "Private radio button gets selected now");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
