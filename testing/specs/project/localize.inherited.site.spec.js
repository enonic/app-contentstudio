/**
 * Created on 07.08.2020.
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
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');

describe('localize.inherited.site.spec - tests for inherited content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const SITE_NAME = studioUtils.generateRandomName('site');
    const EXPECTED_ORDER = "Inherited: Modified date";

    it("Precondition 1 - layer in Default project should be created",
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

    it("WHEN layer's context is selected THEN inherited site should be present in the layer",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
            studioUtils.saveScreenshot("site_is_inherited");
            //2. Verify that inherited site should be present in the layer:
            let result = await contentBrowsePanel.isContentInherited(SITE_NAME);
            assert.isTrue(result, "site from parent project should be displayed with gray mask");
        });

    it("GIVEN inherited site has been selected WHEN 'Sort' dialog has been opened THEN 'Inherited: Modified date' order should be selected in the modal dialog",
        async () => {
            let sortContentDialog = new SortContentDialog();
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
            //2. Select the inherited site and open Sort dialog:
            let result = await studioUtils.findAndSelectItem(SITE_NAME);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            studioUtils.saveScreenshot("inherited_site_order");
            //3. Verify that 'Inherited' order is selected and Save button is disabled:
            let actualOrder = await sortContentDialog.getSelectedOrder();
            assert.equal(actualOrder, EXPECTED_ORDER, "Inherited order should be selected in the modal dialog");
            await sortContentDialog.waitForSaveButtonDisabled();
        });


    it("GIVEN inherited site has been selected WHEN sorting order has been updated THEN the site remains 'inherited' after updating the sorting order",
        async () => {
            let sortContentDialog = new SortContentDialog();
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
            //2. Select the inherited site and open Sort dialog:
            let result = await studioUtils.findAndSelectItem(SITE_NAME);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            await sortContentDialog.clickOnMenuButton();
            //3. Update the sorting order
            await sortContentDialog.selectSortMenuItem(appConstant.sortMenuItem.MANUALLY_SORTED);
            //4. Save and close the modal dialog:
            await sortContentDialog.clickOnSaveButton();
            //5. Verify that site is displayed as 'inherited':
            let isInherited = await contentBrowsePanel.isContentInherited(SITE_NAME);
            assert.isTrue(isInherited, "site remains 'inherited' after updating the sorting order");
        });

    it("GIVEN layer's context is selected WHEN inherited site has been updated THEN the site gets localized",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
            //2. Select the site and click on Localize button then add an application and save it:
            await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            await siteFormPanel.addApplications([appConstant.APP_CONTENT_TYPES]);
            await contentWizard.waitAndClickOnSave();
            //3. Close the site-wizard:
            await studioUtils.doCloseWindowTabAndSwitchToBrowsePanel();
            await contentBrowsePanel.pause(300);
            studioUtils.saveScreenshot("site_in_grid_after_localizing");
            await contentBrowsePanel.waitForGridLoaded(appConstant.shortTimeout);
            //4. Verify that site gets localized:
            let isInherited = await contentBrowsePanel.isContentInherited(SITE_NAME);
            assert.isFalse(isInherited, "Updated content gets localized");
        });

    it("GIVEN localized site is selected WHEN Layers widget has been opened THEN the second item in the widget should contain button 'Edit'",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            //1. Select the layer's context:
            await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
            //2. Open Layers widget:
            await studioUtils.findAndSelectItem(SITE_NAME);
            studioUtils.saveScreenshot("site_widget_after_localizing");
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            //3.Verify that the layer-item is expanded and 'Edit' button should be enabled in the item.
            await browseLayersWidget.waitForEditButtonEnabled(LAYER_DISPLAY_NAME);
        });

    //Verifies:  Options in Widget Selector are not updated after creating/deleting layer #2286
    it("GIVEN single child layer has been deleted WHEN content mode has been switched AND 'Widget Options' has been expanded THEN 'Layers' option should not be present in the dropdown list",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.switchToContentMode();
            let detailsPanel = await contentBrowsePanel.openDetailsPanel();
            await detailsPanel.clickOnWidgetSelectorDropdownHandle();
            let actualOptions = await detailsPanel.getOptionsName();
            assert.isTrue(actualOptions.includes("Details"), "Details option should be present in the dropdown");
            assert.isFalse(actualOptions.includes("Layers"), "Layers option should not be present after deleting the child layer");
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioWithProjects();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
