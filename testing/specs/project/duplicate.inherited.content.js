/**
 * Created on 09.10.2020.
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
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');

describe('duplicate.inherited.content.spec - tests for duplicating of inherited content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const SITE_NAME = studioUtils.generateRandomName('site');
    const EXPECTED_ORDER = `Sorted by "Modified date" in descending order`;

    it("Precondition 1 - layer in Default project should be added",
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

    it("Precondition 2 - new site should be added in 'Default'(parent) context",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            await projectSelectionDialog.selectContext("Default");
            let site = contentBuilder.buildSite(SITE_NAME);
            await studioUtils.doAddSite(site);
        });

    //Verifies Copy of inherited content should not be created as 'inherited' #8269
    //https://github.com/enonic/xp/issues/8269
    it("GIVEN layer's context is selected WHEN inherited site has been duplicated THEN the local copy of the site should not be created as 'inherited'",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);

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

    it("GIVEN duplicate of inherited site is selected WHEN 'Sort' dialog has been opened THEN 'Default' sorting order should be selected in the modal dialog",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
            //2. Select the duplicate of inherited site and open Sort Content dialog:
            await studioUtils.findAndSelectItem(SITE_NAME + "-copy");
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            studioUtils.saveScreenshot("inherited_site_order");
            //3. Verify that 'Default' order is selected :
            let actualOrder = await sortContentDialog.getSelectedOrder();
            assert.equal(actualOrder, EXPECTED_ORDER, "'Modified date' order should be selected in the modal dialog");
        });

    it("GIVEN the local copy of inherited site is selected WHEN Layers widget has been opened THEN only one item with button 'Edit' should be present in the widget",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
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
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Select the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            //2. Confirm the deleting:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioWithProjects();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
