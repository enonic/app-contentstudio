/**
 * Created on 09.10.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');

describe('duplicate.inherited.content.spec - tests for duplicating of inherited content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const SITE_NAME = studioUtils.generateRandomName('site');
    const EXPECTED_ORDER = `Sorted by "Modified date" in descending order`;

    it("Precondition 1 - new layer in Default project should be added by SU",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            //2. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
        });

    it("Precondition 2 - new site should be added by SU in 'Default'(parent) context",
        async () => {
            let site = contentBuilder.buildSite(SITE_NAME);
            await studioUtils.doAddSite(site, true);
        });

    //Verifies Copy of inherited content should not be created as 'inherited' #8269
    //https://github.com/enonic/xp/issues/8269
    it("GIVEN layer's context is selected WHEN inherited site has been duplicated THEN the local copy of the site should not be created as 'inherited'",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            await studioUtils.findAndSelectItem(SITE_NAME);
            let contentDuplicateDialog = await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
            //3. Verify that the copy of the site should not be displayed as 'inherited':
            await studioUtils.findAndSelectItem(SITE_NAME + "-copy");
            studioUtils.saveScreenshot("inherited_site_copy");
            let isInherited = await contentBrowsePanel.isContentInherited(SITE_NAME + "-copy");
            assert.isFalse(isInherited, "Copy of inherited site should not be with gray mask");
        });

    //Verifies #2576 'Inherited icon and Reset button should not be displayed in duplicated content'
    it("GIVEN copy of the inherited site is selected WHEN the site has been opened THEN 'Reset' button should not be displayed in the wizard toolbar",
        async () => {
            //1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            //2. Open the site
            let contentWizard = await studioUtils.selectAndOpenContentInWizard(SITE_NAME + "-copy");
            studioUtils.saveScreenshot("inherited_site_copy_wizard");
            //3. Verify that 'Reset' button is not displayed:
            await contentWizard.waitForResetButtonNotDisplayed();
        });

    it("GIVEN duplicate of inherited site is selected WHEN 'Sort' dialog has been opened THEN 'Default' sorting order should be selected in the modal dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            //1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            //2. Select the duplicate of inherited site and open Sort Content dialog:
            await studioUtils.findAndSelectItem(SITE_NAME + "-copy");
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            studioUtils.saveScreenshot("inherited_site_order");
            //3. Verify that 'Default' order is selected :
            let actualOrder = await sortContentDialog.getSelectedOrder();
            assert.equal(actualOrder, EXPECTED_ORDER, "'Modified date' order should be selected in the modal dialog");
        });

    it.skip(
        "GIVEN the local copy of inherited site is selected WHEN Layers widget has been opened THEN only one item with button 'Edit' should be present in the widget",
        async () => {
            //1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            //2. Select the local copy of inherited site and open Layers widget:
            await studioUtils.findAndSelectItem(SITE_NAME + "-copy");
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            studioUtils.saveScreenshot("layers_widget_local_copy_of_site");
            //3.Verify that only one item with button 'Open' should be present in the widget:
            let layers = await browseLayersWidget.getLayersName();
            assert.equal(layers.length, 1, "Only one item should be present in the widget");
            await browseLayersWidget.waitForEditButtonEnabled(LAYER_DISPLAY_NAME);
        });

    it("Postconditions: the layer should be deleted",
        async () => {
            await studioUtils.openSettingsPanel();
            await studioUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
