/**
 * Created on 09.09.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');

describe('layers.content.tree.dialog.spec - tests for Layers Content Tree modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const TEST_FOLDER_DISPLAY_NAME = studioUtils.generateRandomName("folder");
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const LAYER1_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const LAYER2_DISPLAY_NAME = studioUtils.generateRandomName("layer");

    it("Preconditions: new project with folder should be added",
        async () => {
            //1. Navigate to Settings Panel and save new project:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, "description");
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            let folder = contentBuilder.buildFolder(TEST_FOLDER_DISPLAY_NAME);
            await studioUtils.doAddFolder(folder);
        });

    it("Precondition 1 - the first layer(En) should be added in Default project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName(LAYER1_DISPLAY_NAME);
            await layerWizard.selectLanguage(appConst.LANGUAGES.EN);
            //2. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
        });

    it("Precondition 2 - the second layer(Norsk no) should be added in Default project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(LAYER1_DISPLAY_NAME);
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName(LAYER2_DISPLAY_NAME);
            await layerWizard.selectLanguage(appConst.LANGUAGES.NORSK_NO);
            //2. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
        });

    it.skip(
        "GIVEN existing folder is selected in the layer WHEN 'Show All' button has been clicked THEN Layers Tree dialog should be loaded",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            //1. Open modal dialog and select the layer's context:
            await contentBrowsePanel.selectContext(LAYER1_DISPLAY_NAME);
            //2. Select the folder and open Layers widget:
            await studioUtils.findAndSelectItem(TEST_FOLDER_DISPLAY_NAME);
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            let layersContentTreeDialog = await browseLayersWidget.clickOnShowAllButton();
            studioUtils.saveScreenshot("layers_tree_dialog_1");
            //3. Verify the title:
            let title = await layersContentTreeDialog.getTitle();
            assert.equal(TEST_FOLDER_DISPLAY_NAME, title, "Expected title should be in the modal dialog");
            let layers = await layersContentTreeDialog.getLayersName();
            //4. Verify that all items are present in the Layers Tree:
            assert.equal(layers[0], PROJECT_DISPLAY_NAME, "Expected project should be present in the tree layers");
            assert.equal(layers[1], LAYER1_DISPLAY_NAME, "The first layer should be present in the tree layers");
            assert.equal(layers[2], LAYER2_DISPLAY_NAME, "The second layer should be present in the tree layers");
        });

    it.skip(
        "GIVEN inherited content is selected AND Layers Tree dialog is opened WHEN current list item has been clicked THEN 'Localise' button gets visible in the tree list item",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            //1. Open modal dialog and select the layer's context:
            await contentBrowsePanel.selectContext(LAYER1_DISPLAY_NAME);
            //2. Select the folder and open Layers widget:
            await studioUtils.findAndSelectItem(TEST_FOLDER_DISPLAY_NAME);
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            let layersContentTreeDialog = await browseLayersWidget.clickOnShowAllButton();
            //3. Click and expand the list item:
            await layersContentTreeDialog.clickOnLayerByName(LAYER1_DISPLAY_NAME);
            studioUtils.saveScreenshot("layers_tree_dialog_2");
            //4. Verify that 'Localize' button is present in the tree item:
            let buttonLabel = await layersContentTreeDialog.getButtonLabelInItemView(LAYER1_DISPLAY_NAME);
            assert.equal(buttonLabel, "Localize", "'Localize' button gets visible in the tree list item");
        });

    it("WHEN layer, that has child layer, have been selected THEN 'Delete' button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Verify that layer with child layer can not be deleted:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER1_DISPLAY_NAME);
            studioUtils.saveScreenshot("layers_tree_toolbar_1");
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //2. Verify that layer without child can be deleted:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER2_DISPLAY_NAME);
            studioUtils.saveScreenshot("layers_tree_toolbar_2");
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    it("WHEN children layers have been sequentially removed THEN parent project can be deleted",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            //1.Delete the first layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER2_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER2_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await settingsBrowsePanel.waitForNotificationMessage();
            //2.Delete the second layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER1_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER1_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await settingsBrowsePanel.waitForNotificationMessage();
            //3. Verify that Delete button gets enabled after selecting the parent project
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            studioUtils.saveScreenshot("layers_tree_toolbar_3");
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
