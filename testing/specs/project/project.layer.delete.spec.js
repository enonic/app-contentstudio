/**
 * Created on 23.07.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const projectUtils = require('../../libs/project.utils.js');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');
const LayerWizardPanel = require('../../page_objects/project/layer.wizard.panel');

describe('layer.in.public.project.spec - ui-tests for layer in existing project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const TEST_DESCRIPTION = 'test description';

    it(`Preconditions: new project(with Norsk (no) language) and 'Private' access mode should be added`,
        async () => {
            // 1. Save new project (mode access is Public):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConst.LANGUAGES.NORSK_NO, null, 'Public');
        });

    it("GIVEN new layer has been created WHEN the layer has been reopened THEN 'Copy Access mode' button is enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizardPanel();
            // 1.Create new layer in the Default project:
            await projectUtils.clickOnNewAndOpenProjectWizardDialog();
            let layer = projectUtils.buildLayer(PROJECT_DISPLAY_NAME, null, appConst.PROJECT_ACCESS_MODE.PRIVATE, null,
                null, LAYER_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
            // 2.Click on the layer and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 3. Verify that 'Copy Access mode from parent' button should be enabled(because Public access is in parent project):
            await layerWizard.waitForCopyAccessModeFromParentEnabled(PROJECT_DISPLAY_NAME);
            // 4. Verify that 'Copy language from parent' button is enabled:
            await layerWizard.waitForCopyLanguageFromParentEnabled(PROJECT_DISPLAY_NAME);
            // And 'Copy roles from parent' is disabled
            await layerWizard.waitForCopyRolesFromParentDisabled(PROJECT_DISPLAY_NAME);
        });

    it("GIVEN new layer is created WHEN the layer has been deleted in the wizard THEN layer should not be present in the grid",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            let layerWizard = new LayerWizardPanel();
            let result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.ok(result, "Expander icon should be displayed for the parent project");
            // 1.Select 'public' project and open wizard for new layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 3. Click on 'Delete' button and confirm the deleting:
            await layerWizard.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            await settingsBrowsePanel.waitForGridLoaded(appConst.shortTimeout);
            // 4. Verify that the layer is deleted in Browse Panel:
            await settingsBrowsePanel.waitForProjectNotDisplayed(LAYER_DISPLAY_NAME);
            // 5. Verify that expander-icon gets not visible in the parent project
            result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.ok(result === false, "Expander icon gets not displayed in the parent project");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child layer.
    it("GIVEN layer was deleted in the previous step WHEN the parent project is opened THEN 'Delete' button gets enabled in the wizard-toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Open the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Verify that Delete button is enabled now:
            await projectWizard.waitForDeleteButtonEnabled();
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/2105
    // Do not allow deletion of a project if it has child layer.
    it("GIVEN layer was deleted WHEN the parent project has been selected THEN 'Delete' button gets enabled now",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Select the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 2. Verify that 'Delete' button is enabled after deleting the layer
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    it("Post conditions: the project should be deleted",
        async () => {
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
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
