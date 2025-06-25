/**
 * Created on 30.07.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const LayerWizardPanel = require('../../page_objects/project/layer.wizard.panel');
const SettingsItemStatisticsPanel = require('../../page_objects/project/settings.item.statistics.panel');
const appConst = require('../../libs/app_const');

describe('layer.wizard.unsaved.changes.spec - checks unsaved changes in layer wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const PARENT_PROJECT = 'Default';

    it("GIVEN layer(in Default) with roles has been saved and reopened WHEN 'Copy roles from parent' has been clicked THEN 'Save' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1. Open Project Wizard Dialog:
            await projectUtils.selectParentAndOpenProjectWizardDialog(appConst.PROJECTS.DEFAULT_PROJECT_NAME);
            let layer = projectUtils.buildLayer(PARENT_PROJECT, appConst.LANGUAGES.EN, appConst.PROJECT_ACCESS_MODE.PRIVATE, 'Super User',
                null, LAYER_DISPLAY_NAME)
            // 2. Fill in forms in the wizard then click on Create button:
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
            // 3.Open just created layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 4. Click on 'Copy roles from parent':
            await layerWizard.clickOnCopyRolesFromParent(PARENT_PROJECT);
            // 5. Verify that notification message appears:
            await layerWizard.waitForNotificationMessage();
            // 6. Verify that 'Save' button gets enabled:
            await layerWizard.waitForSaveButtonEnabled();
            // 7. Click on 'Home' (SETTINGS) button and go to the grid:
            await settingsBrowsePanel.clickOnHomeButton();
            // 8. Verify that the layer is displayed with the language icon, because Save button is not pressed yet:
            let flagCode = await settingsBrowsePanel.waitForLanguageIconDisplayed(LAYER_DISPLAY_NAME);
            assert.equal(flagCode, "gb", "Expected language icon should be displayed in the grid");
            // 9. Verify the language in the Statistics Panel:
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            await studioUtils.saveScreenshot('layer_created_with_language');
            let actualLanguage = await settingsItemStatisticsPanel.getLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, "Expected language should be displayed in Statistics panel.");
        });

    it("GIVEN existing layer with roles is opened WHEN 'Copy roles from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let layerWizard = new LayerWizardPanel();
            // 1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Click on 'Copy Roles from parent':
            await layerWizard.clickOnCopyRolesFromParent(PARENT_PROJECT);
            await layerWizard.waitForNotificationMessage();
            // 4. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_DISPLAY_NAME);
            await studioUtils.saveScreenshot('layer_wizard_unsaved_changes_1');
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConst.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("GIVEN existing layer is opened WHEN 'Copy access mode from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let layerWizard = new LayerWizardPanel();
            // 1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            await layerWizard.clickOnCopyAccessModeFromParent(PARENT_PROJECT);
            // 2. Confirm the action:
            await confirmationDialog.clickOnConfirmButton();
            await layerWizard.waitForNotificationMessage();
            // 3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_DISPLAY_NAME);
            await studioUtils.saveScreenshot("layer_wizard_unsaved_changes_2");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConst.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("GIVEN existing layer with 'En' language is opened WHEN 'Copy language mode from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let layerWizard = new LayerWizardPanel();
            // 1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Click on Copy button:
            await layerWizard.clickOnCopyLanguageFromParent(PARENT_PROJECT);
            await layerWizard.waitForNotificationMessage();
            // 3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_DISPLAY_NAME);
            await studioUtils.saveScreenshot('layer_wizard_unsaved_changes_3');
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConst.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("WHEN existing layer selected and has been deleted THEN expected notification message should appear",
        async () => {
            // 1.Select and delete the layer:
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
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
