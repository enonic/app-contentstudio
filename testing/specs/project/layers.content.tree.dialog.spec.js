/**
 * Created on 09.09.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('layers.content.tree.dialog.spec - tests for Layers Content Tree modal dialog', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const TEST_FOLDER_DISPLAY_NAME = "All Content types images";
    const LAYER1_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const LAYER2_DISPLAY_NAME = studioUtils.generateRandomName("layer");

    it("Precondition 1 - the first layer(En) should be added in Default project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName(LAYER1_DISPLAY_NAME);
            await layerWizard.selectLanguage(appConstant.LANGUAGES.EN);
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
            await layerWizard.selectLanguage(appConstant.LANGUAGES.NORSK_NO);
            //2. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
        });

    it("GIVEN existing folder is selected in the layer WHEN 'Show All' button has been clicked THEN Layers Tree dialog should be loaded",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            //1. Open modal dialog and select the layer's context:
            await contentBrowsePanel.selectContext(LAYER1_DISPLAY_NAME);
            //2. Select the folder and open Layers widget:
            await studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME);
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            let layersContentTreeDialog = await browseLayersWidget.clickOnShowAllButton();
            studioUtils.saveScreenshot("layers_tree_dialog_1");
            //3. Verify the title:
            let title = await layersContentTreeDialog.getTitle();
            assert.equal(TEST_FOLDER_DISPLAY_NAME, title, "Expected title should be in the modal dialog");
            let layers = await layersContentTreeDialog.getLayersName();
            //4. Verify that all items are present in the Layers Tree:
            assert.equal(layers[0], "default", "Default project should be present in the tree layers");
            assert.equal(layers[1], LAYER1_DISPLAY_NAME + " (en)", "The first layer should be present in the tree layers");
            //assert.equal(layers[2], LAYER2_DISPLAY_NAME+ " (no)", "The second layer should be present in the tree layers");
        });

    it("GIVEN inherited content is selected AND Layers Tree dialog is opened WHEN current list item has been clicked THEN 'Localise' button gets visible in the tree list item",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            //1. Open modal dialog and select the layer's context:
            await contentBrowsePanel.selectContext(LAYER1_DISPLAY_NAME);
            //2. Select the folder and open Layers widget:
            await studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME);
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            let layersContentTreeDialog = await browseLayersWidget.clickOnShowAllButton();
            //3. Click and expand the list item:
            await layersContentTreeDialog.clickOnLayerByName(LAYER1_DISPLAY_NAME);
            studioUtils.saveScreenshot("layers_tree_dialog_2");
            //4. Verify that 'Localize' button is present in the tree item:
            let buttonLabel = await layersContentTreeDialog.getButtonLabelInItemView(LAYER1_DISPLAY_NAME);
            assert.equal(buttonLabel, "Localize", "'Localize' button gets visible in the tree list item");
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
