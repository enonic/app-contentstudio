/**
 * Created on 23.07.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const LayerWizard = require('../../page_objects/project/layer.wizard.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');

describe('layer.in.public.project.spec - ui-tests for layer in existing project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const TEST_DESCRIPTION = "test description";

    it(`Preconditions: new project(with Norsk (no) language) and 'Private' access mode should be added`,
        async () => {
            //1. Save new project (mode access is Public):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConstant.LANGUAGES.NORSK_NO, null, "Public");
        });

    it("GIVEN existing project is selected AND wizard for new layer is opened WHEN 'Private' radio has been clicked and name input filled in THEN 'Copy Access mode' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'public' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            await layerWizard.typeDisplayName("test layer1");
            //2. Click on 'Private' radio button:
            await layerWizard.clickOnAccessModeRadio("Private");
            //3. Verify that 'Copy Access mode from parent' button gets enabled:
            await layerWizard.waitForCopyAccessModeFromParentEnabled();
            //4. Verify that 'Copy language from parent' button is enabled:
            await layerWizard.waitForCopyLanguageFromParentEnabled();
            //And 'Copy roles from parent' is disabled
            await layerWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN Buttons: 'Copy language from parent' has been clicked and 'Save' pressed WHEN layer's context has been switched THEN expected language should be displayed in the project context",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'public' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            //2. Click on 'Private' radio button:
            await layerWizard.clickOnAccessModeRadio("Private");
            //3. Click on 'Copy language from parent' button:
            await layerWizard.clickOnCopyLanguageFromParent();
            await layerWizard.waitForNotificationMessage();
            //4. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            await layerWizard.waitForSpinnerNotVisible(appConstant.saveProjectTimeout);
            //5. Switch to Content Mode:
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            //6. Open modal dialog and select the layer's context:
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            await contentBrowsePanel.pause(1000);
            //7. Verify that expected language is copied from the parent project:
            let actualLanguage = await contentBrowsePanel.getContextLanguage();
            assert.equal(actualLanguage, "(no)", "Expected language should be displayed in the App Bar")
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2839
    //Settings grid - duplicate items appear after clicking on Show Selection button #2839
    it("GIVEN existing project and its layer are selected WHEN Show Selection has been clicked THEN two items should be filtered in the grid",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizard();
            //1.Select the project and its child layer:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME);
            //2. Click on Show Selection:
            await settingsBrowsePanel.clickOnSelectionToggler();
            //3. Verify that only 2 items are displayed in the grid:
            let items = await settingsBrowsePanel.getDisplayNames();
            assert.isTrue(items.includes(PROJECT_DISPLAY_NAME), "Project should be present in the grid");
            assert.isTrue(items.includes(LAYER_DISPLAY_NAME), "Layer should be present in the grid");
            assert.equal(items.length, 2, "only 2 items should be present in the grid");
        });

    it("GIVEN existing layer is opened WHEN the language has been updated THEN expected language should be displayed in the layer's context",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = new LayerWizard();
            //1.Open the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            //2. Update the language:
            await layerWizard.clickOnRemoveLanguage();
            await layerWizard.selectLanguage(appConstant.LANGUAGES.EN);
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            //3. Switch to content mode and select the context:
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
            //1.Select the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //2. Verify that 'Delete' button is disabled
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //3. Parent project should be with 'expander-icon'
            let result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.isTrue(result, "Expander icon should be displayed in the parent project");
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
            //1.parent project and its child project are selected:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(LAYER_DISPLAY_NAME);
            //2. Verify that 'Delete' button is disabled in browse-panel:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("multiselect_layer_context_menu");
            //Verify that New.. and Edit items are enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            //Verify that 'Delete' menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    //Verifies issue https://github.com/enonic/app-contentstudio/issues/2091
    //Content Browse Panel - The closest allowed context should be loaded after a layer is deleted
    it("GIVEN existing layer has been deleted WHEN content mode has been switched THEN Default context should be loaded",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            //1. Switch to layer's context:
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            let actualContextName1 = await contentBrowsePanel.getSelectedProjectDisplayName();
            await studioUtils.openSettingsPanel();

            //2. Switch to Settings and delete the layer:
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
            let expectedMessage = appConstant.projectDeletedMessage(LAYER_DISPLAY_NAME);
            assert.equal(message, expectedMessage, "'Project is deleted' this message should appear");
            let actualContextName2 = await contentBrowsePanel.getSelectedProjectDisplayName();
            assert.equal(actualContextName1, LAYER_DISPLAY_NAME, "layer's context should be loaded before the deleting of the layer");
            assert.equal(actualContextName2, PROJECT_DISPLAY_NAME, "Parent context should be loaded after deleting its layer");
        });

    it("GIVEN new layer is created WHEN the layer has been deleted in the wizard THEN layer should not be present in the grid",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            //1.Select 'public' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            //2. Save new layer:
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            await layerWizard.clickOnAccessModeRadio("Private");
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            await layerWizard.pause(500);
            //3. Click on 'Delete' button and confirm the deleting:
            await layerWizard.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            await settingsBrowsePanel.waitForGridLoaded(appConstant.shortTimeout);
            //4. Verify that the layer is deleted in Browse Panel:
            await settingsBrowsePanel.waitForProjectNotDisplayed(LAYER_DISPLAY_NAME);
            //5. Verify that expander-icon gets not visible in the parent project
            let result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.isFalse(result, "Expander icon gets not displayed in the parent project");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child layer.
    it("GIVEN layer was deleted WHEN the parent project is opened THEN 'Delete' button gets enabled in the wizard-toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that Delete button is enabled now:
            await projectWizard.waitForDeleteButtonEnabled();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child layer.
    it("GIVEN layer was deleted WHEN the parent project has been selected THEN 'Delete' button gets enabled now",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //2. Verify that 'Delete' button is enabled after deleting the layer
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    it("Postconditions: the project should be deleted",
        async () => {
            await studioUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
