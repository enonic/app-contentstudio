/**
 * Created on 30.07.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const LayerWizardPanel = require('../../page_objects/project/layer.wizard.panel');

describe('layer.wizard.unsaved.changes.spec - checks unsaved changes in layer wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");

    it("GIVEN new layer(in Default) with roles is saved WHEN 'Copy roles from parent' has been clicked THEN 'Save' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            await layerWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            await layerWizard.selectLanguage(appConstant.LANGUAGES.EN);
            //2. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            await layerWizard.waitForSaveButtonDisabled();
            //3. Click on 'Copy roles from parent':
            await layerWizard.clickOnCopyRolesFromParent();
            await layerWizard.waitForNotificationMessage();
            //4. Verify that 'Save' button gets enabled after removing the selected item in the Roles form:
            await layerWizard.waitForSaveButtonEnabled();
        });

    it("GIVEN existing layer with roles is opened WHEN 'Copy roles from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let layerWizard = new LayerWizardPanel();
            //1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            //2. Click on Copy Roles from parent:
            await layerWizard.clickOnCopyRolesFromParent();
            await layerWizard.waitForNotificationMessage();
            //4. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_DISPLAY_NAME);
            studioUtils.saveScreenshot("layer_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("GIVEN existing layer is opened WHEN 'Copy access mode from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let layerWizard = new LayerWizardPanel();
            //1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            await layerWizard.clickOnCopyAccessModeFromParent();
            //2. Confirm the coping:
            await confirmationDialog.clickOnYesButton();
            await layerWizard.waitForNotificationMessage();
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_DISPLAY_NAME);
            studioUtils.saveScreenshot("layer_wizard_unsaved_changes_2");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("GIVEN existing layer with 'En' language is opened WHEN 'Copy language mode from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let layerWizard = new LayerWizardPanel();
            //1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            //2. Click on Copy button:
            await layerWizard.clickOnCopyLanguageFromParent();
            await layerWizard.waitForNotificationMessage();
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_DISPLAY_NAME);
            studioUtils.saveScreenshot("layer_wizard_unsaved_changes_3");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("WHEN existing layer selected and has been deleted THEN expected notification message should appear",
        async () => {
            //1.Select and delete the layer:
            await studioUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioWithProjects();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
