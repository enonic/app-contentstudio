/**
 * Created on 07.08.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');
const appConst = require('../../libs/app_const');

describe('localize.inherited.site.spec - tests for inherited content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const SITE_NAME = studioUtils.generateRandomName('site');
    const EXPECTED_ORDER = "Inherited: Modified date";

    it("Precondition 1 - layer in Default project should be created",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Select 'Default' project and open wizard for new layer:
            await settingsBrowsePanel.openProjectWizardDialog();
            let layer = projectUtils.buildProject("Default", null, appConst.PROJECT_ACCESS_MODE.PUBLIC, null,
                null, LAYER_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("Precondition 2 - new site should be added in 'Default'(parent) context",
        async () => {
            let site = contentBuilder.buildSite(SITE_NAME);
            await studioUtils.doAddSite(site, true);
        });

    it("WHEN layer's context is selected THEN inherited site should be present in the layer",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the layer's context:
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            await studioUtils.saveScreenshot("site_is_inherited");
            //2. Verify that inherited site should be present in the layer:
            let result = await contentBrowsePanel.isContentInherited(SITE_NAME);
            assert.isTrue(result, "site from parent project should be displayed with gray mask");
        });

    it("GIVEN inherited site has been selected WHEN 'Sort' dialog has been opened THEN 'Inherited: Modified date' order should be selected in the modal dialog",
        async () => {
            let sortContentDialog = new SortContentDialog();
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. layer's context should be selected automatically:
            //await projectSelectionDialog.selectContext(LAYER_DISPLAY_NAME);
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
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. layer's context should be selected automatically:
            //await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            //2. Select the inherited site and open Sort dialog:
            let result = await studioUtils.findAndSelectItem(SITE_NAME);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            await sortContentDialog.clickOnMenuButton();
            //3. Update the sorting order
            await sortContentDialog.selectSortMenuItem(appConst.sortMenuItem.MANUALLY_SORTED);
            //4. Save and close the modal dialog:
            await sortContentDialog.clickOnSaveButton();
            //5. Verify that site is displayed as 'inherited':
            let isInherited = await contentBrowsePanel.isContentInherited(SITE_NAME);
            assert.isTrue(isInherited, "site remains 'inherited' after updating the sorting order");
        });

    it("GIVEN layer's context is selected WHEN inherited site has been updated THEN the site gets localized",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. layer's context should be selected automatically:
            //await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            //2. Select the site and click on Localize button then add an application and save it:
            await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            //Site should be automatically saved after the selecting an application with controllers:
            await siteFormPanel.addApplications([appConst.APP_CONTENT_TYPES]);
            //3. Close the site-wizard:
            await studioUtils.doCloseWindowTabAndSwitchToBrowsePanel();
            await contentBrowsePanel.pause(300);
            studioUtils.saveScreenshot("site_in_grid_after_localizing");
            await contentBrowsePanel.waitForGridLoaded(appConst.shortTimeout);
            //4. Verify that site gets localized:
            let isInherited = await contentBrowsePanel.isContentInherited(SITE_NAME);
            assert.isFalse(isInherited, "Updated content gets localized");
        });

    it.skip(
        "GIVEN localized site is selected WHEN Layers widget has been opened THEN the second item in the widget should contain button 'Edit'",
        async () => {
            //1.  layer's context should be selected automatically:
            //2. Open Layers widget:
            await studioUtils.findAndSelectItem(SITE_NAME);
            studioUtils.saveScreenshot("site_widget_after_localizing");
            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            //3.Verify that the layer-item is expanded and 'Edit' button should be enabled in the item.
            await browseLayersWidget.waitForEditButtonEnabled(LAYER_DISPLAY_NAME);
        });

    it("Post conditions - the layer should be deleted",
        async () => {
            await studioUtils.openSettingsPanel();
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioWithProjects();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
