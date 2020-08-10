/**
 * Created on 03.08.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');

describe('subproject.localize.button.spec - checks Localize button in browse toolbar and Layers widget', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const SUBPROJECT_DISPLAY_NAME = studioUtils.generateRandomName("sub");
    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    const EXPECTED_LANGUAGE_IN_WIZARD = "norsk (no)";

    it("Precondition 1 - subproject with Norsk(no) language should be created",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.clickOnAccessModeRadio("Public");
            await subprojectWizard.typeDisplayName(SUBPROJECT_DISPLAY_NAME);
            await subprojectWizard.selectLanguage(appConstant.LANGUAGES.NORSK_NO);
            //2. Save the subproject:
            await subprojectWizard.waitAndClickOnSave();
            await subprojectWizard.waitForNotificationMessage();
        });
    it("Precondition 2 - new folder should be added in 'Default' context",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            await projectSelectionDialog.selectContext("Default");
            let folder = contentBuilder.buildFolder(FOLDER_NAME);
            await studioUtils.doAddFolder(folder);
        });

    it("GIVEN subproject context is switched WHEN a content that is inherited from a parent has been selected THEN 'Localize' button gets visible and enabled",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the subproject's context:
            await projectSelectionDialog.selectContext(SUBPROJECT_DISPLAY_NAME);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            studioUtils.saveScreenshot("localize_button_browse_panel_enabled");
            //2. Verify that Localize button is enabled in the browse toolbar
            await contentBrowsePanel.waitForLocalizeButtonEnabled();
        });

    it("WHEN content that is inherited from a parent has been selected THEN 'Localize' button should be enabled in the second layer widget item",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            //1. Select the subproject's context:
            await projectSelectionDialog.selectContext(SUBPROJECT_DISPLAY_NAME);
            //2. Select the folder that was inherited from the parent project:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            //3. Open Layers widget:
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            studioUtils.saveScreenshot("localize_button_widget_enabled");
            //4. Verify that two items should be displayed in the widget:
            let layers = await browseLayersWidget.getLayersName();
            assert.equal(layers.length, 2, "Two layers should be present in the widget");
            //5. Verify that 'Localize' button is enabled in the second item:
            await browseLayersWidget.waitForLocalizeButtonEnabled(SUBPROJECT_DISPLAY_NAME);
        });

    it("GIVEN content that is inherited from a parent has been selected WHEN Layers widget has been opened THEN expected layers should be present",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            await projectSelectionDialog.selectContext(SUBPROJECT_DISPLAY_NAME);
            //1. Select the folder in subproject and open Layers widget:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            let layers = await browseLayersWidget.getLayersName();
            //2. Verify names of layers:
            assert.equal(layers[0], "Default", "Default layer should be present in the widget");
            assert.equal(layers[1], SUBPROJECT_DISPLAY_NAME, "subproject's layer should be present in the widget");
            let language = await browseLayersWidget.getLayerLanguage(SUBPROJECT_DISPLAY_NAME);
            //3. Verify Localize button in the widget:
            await browseLayersWidget.waitForLocalizeButtonEnabled(SUBPROJECT_DISPLAY_NAME);
            //4. Verify the language in the widget:
            assert.equal(language, "(no)", "Expected language should be displayed in the layer");
        });

    it("GIVEN content that is inherited from a parent has been selected WHEN Localize button(in widget) has been clicked THEN the content should be loaded in the new wizard tab",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentWizard = new ContentWizard();
            let wizardSettingsForm = new SettingsForm();
            await projectSelectionDialog.selectContext(SUBPROJECT_DISPLAY_NAME);
            //1. Select the folder in subproject and open Layers widget:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            //2. Click on 'Localize' button:
            let layers = await browseLayersWidget.clickOnLocalizeButton(SUBPROJECT_DISPLAY_NAME);
            await studioUtils.doSwitchToNextTab();
            //4. Verify that expected content is loaded in wizard page:
            await contentWizard.waitForOpened();
            let actualDisplayName = await contentWizard.getDisplayName();
            let actualProjectName = await contentWizard.getProjectDisplayName();
            let actualLanguage = await wizardSettingsForm.getSelectedLanguage();
            assert.equal(actualLanguage, EXPECTED_LANGUAGE_IN_WIZARD, "Expected language should be displayed in the wizard");
            assert.equal(actualDisplayName, FOLDER_NAME, "Expected folder's displayName should be displayed in the wizard");
            assert.equal(actualProjectName, SUBPROJECT_DISPLAY_NAME + "(no)",
                "Expected project displayName should be displayed in the wizard");
        });


    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioApp();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
