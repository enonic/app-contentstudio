/**
 * Created on 26.11.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const NewSettingsItemDialog = require('../../page_objects/project/new.settings.item.dialog');
const LayerWizard = require('../../page_objects/project/layer.wizard.panel');

describe('layer.wizard.select.parent.project.spec - ui-tests for selecting parent project in layer wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");


    it("GIVEN no selections in Project Settings panel WHEN 'New' button has been pressed THEN modal dialog with two menu items(Project and Layer) should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //1.Select 'Default' project and open wizard for new layer:
            await settingsBrowsePanel.clickOnNewButton();
            await newSettingsItemDialog.waitForDialogLoaded();
            //2.Verify that 'Project' and 'Layer' menu items are displayed:
            await newSettingsItemDialog.waitForProjectDialogItem();
            await newSettingsItemDialog.waitForLayerDialogItem();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2568
    //Layer wizard - options filter input for parent project is case sensitive
    it("GIVEN no selections in Project Settings panel AND wizard for new layer is opened WHEN 'Default' project has been selected in parent project selector THEN 'Save' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            let layerWizard = new LayerWizard();
            //1.Select 'Default' project and open wizard for new layer:
            await settingsBrowsePanel.clickOnNewButton();
            await newSettingsItemDialog.waitForDialogLoaded();
            //2.Click on Layer menu item and open layer-wizard:
            await newSettingsItemDialog.clickOnProjectItem("Layer");
            await layerWizard.waitForLoaded();
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            await layerWizard.clickOnAccessModeRadio("Private");
            //3. Select Default project as parent:
            await layerWizard.selectParentProject("Default");
            //4. Save the layer:
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
        });

    it("Postconditions: the layer should be deleted",
        async () => {
            //1.Select and delete the layer:
            await studioUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
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
