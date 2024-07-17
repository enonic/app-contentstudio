/**
 * Created on 23.07.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const LayerWizard = require('../../page_objects/project/layer.wizard.panel');
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
            //1. Save new project (Public access mode):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConst.LANGUAGES.NORSK_NO, null, "Public");
        });

    it("GIVEN Buttons: 'Copy language from parent' has been clicked and 'Save' pressed WHEN layer's context has been switched THEN expected language should be displayed in the project context",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await projectUtils.clickOnNewAndOpenProjectWizardDialog();
            let layerWizard = new LayerWizardPanel();
            // 1. Create new layer (private access mode):
            let layer = projectUtils.buildLayer(PROJECT_DISPLAY_NAME, null, appConst.PROJECT_ACCESS_MODE.PRIVATE, null, null,
                LAYER_DISPLAY_NAME, null, null);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
            // 2.Click on the layer and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 3. Click on 'Copy language from parent' button:
            await layerWizard.clickOnCopyLanguageFromParent(PROJECT_DISPLAY_NAME);
            await layerWizard.waitForNotificationMessage();
            // 4. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            await layerWizard.waitForSpinnerNotVisible(appConst.saveProjectTimeout);
            // 5. Switch to Content Mode:
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            // 6. Open modal dialog and select the layer's context:
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            await contentBrowsePanel.pause(1000);
            // 7. Verify that expected language is copied from the parent project:
            let actualLanguage = await contentBrowsePanel.getContextLanguage();
            assert.equal(actualLanguage, "(no)", "Expected language should be displayed in the App Bar")
        });

    it("GIVEN existing layer is opened WHEN the language has been updated THEN expected language should be displayed in the layer's context",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizard();
            // 1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 2. Update the language:
            await layerWizard.clickOnRemoveLanguage();
            await layerWizard.selectLanguage(appConst.LANGUAGES.EN);
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            // 3. Switch to content mode and select the context:
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            //4. Verify that language is updated in the browse panel - App Bar
            let actualLanguage = await contentBrowsePanel.getContextLanguage();
            assert.equal(actualLanguage, "(en)", "Expected language should be displayed in the App Bar");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child layer.
    it("WHEN existing parent project is selected THEN Delete button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Select the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 2. Verify that 'Delete' button is disabled
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            // 3. Parent project should be with 'expander-icon'
            let result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.ok(result, "Expander icon should be displayed in the parent project");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child layer.
    it("WHEN existing parent project(with child layer) is opened THEN 'Delete' button should be disabled in the wizard-toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that 'Delete' button is disabled:
            await projectWizard.waitForDeleteButtonDisabled();
        });

    it("WHEN existing parent project and its child project are selected THEN 'Delete' button should be disabled in the browse-toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.parent project and its child project are selected:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(LAYER_DISPLAY_NAME);
            //2. Verify that 'Delete' button is disabled in browse-panel:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    //Verifies issue: Do not allow deletion of a project if it has child layer #2105
    it("WHEN project and its layer are selected THEN 'Delete' menu item should be disabled in context-menu",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.parent project and its child project are selected:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(LAYER_DISPLAY_NAME);
            // 2. Verify that 'Delete' button is disabled in browse-panel:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            await studioUtils.saveScreenshot('multiselect_layer_context_menu');
            // Verify that New... and Edit items are enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            // Verify that 'Delete' menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    //Verifies issue https://github.com/enonic/app-contentstudio/issues/2091
    //Content Browse Panel - The closest allowed context should be loaded after a layer is deleted
    it("GIVEN existing layer has been deleted WHEN content mode has been switched THEN Default context should be loaded",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            // 1. Switch to layer's context:
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            let actualContextName1 = await contentBrowsePanel.getSelectedProjectDisplayName();
            await studioUtils.openSettingsPanel();
            // 2. Switch to Settings and delete the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            let confirmValueDialog = new ConfirmValueDialog();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            let message = await settingsBrowsePanel.waitForNotificationMessage();
            //3. Switch to content mode and verify that parent project's context is loaded:
            await studioUtils.switchToContentMode();
            let expectedMessage = appConst.projectDeletedMessage(LAYER_DISPLAY_NAME);
            assert.equal(message, expectedMessage, "'Project is deleted' this message should appear");
            let actualContextName2 = await contentBrowsePanel.getSelectedProjectDisplayName();
            assert.equal(actualContextName1, LAYER_DISPLAY_NAME, "layer's context should be loaded before the deleting of the layer");
            assert.equal(actualContextName2, PROJECT_DISPLAY_NAME, "Parent context should be loaded after deleting its layer");
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
