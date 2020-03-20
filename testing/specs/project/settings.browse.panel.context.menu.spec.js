/**
 * Created on 20.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const NewSettingsItemDialog = require('../../page_objects/project/new.settings.item.dialog');

describe('settings.browse.panel.context.menu.spec - ui-tests to verify context menu items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN right click on 'Projects' folder THEN 'New...' should be enabled , 'Delete' and 'Edit' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Go to Settings Panel and do right click on Projects folder:
            await settingsBrowsePanel.rightClickOnProjects();
            //Verify that 'New...' button should be enabled:
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("projects_context_menu");
            let result = await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            //Verify that Edit,Delete menu items should be disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Edit');
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    it(`WHEN right click on 'Default' folder THEN 'New...' should be enabled , 'Delete' and 'Edit' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //1. Expand 'Projects' folder:
            await settingsBrowsePanel.clickOnExpanderIcon(appConst.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2. Do right click on 'Default' folder and Open Context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName("Default");
            //Verify that 'New...' button should be enabled:
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("default_context_menu");
            //Verify that New.. is enabled:
            let result = await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            //Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    it(`GIVEN right click on Projects folder WHEN 'New..' menu has been clicked THEN 'New Settings Item Dialog' should be loaded`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let newSettingsItemDialog = new NewSettingsItemDialog();
            //1. Go to Settings Panel and do right click on Projects folder:
            await settingsBrowsePanel.rightClickOnProjects();
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            //2. Click on 'New...' menu item:
            await settingsBrowsePanel.clickOnMenuItem("New...");
            studioUtils.saveScreenshot("projects_context_menu_new");
            //3. Verify that the modal dialog is loaded:
            await newSettingsItemDialog.waitForDialogLoaded();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
