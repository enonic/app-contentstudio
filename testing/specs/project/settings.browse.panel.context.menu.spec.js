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
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('settings.browse.panel.context.menu.spec - ui-tests to verify context menu items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName("project");

    it(`Preconditions: 2 projects should be added`,
        async () => {
            //1. Save new project:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME_1, "description");
        });

    it(`WHEN right click on 'Projects' folder THEN 'New...' should be enabled , 'Delete' and 'Edit' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Go to Settings Panel and do right click on Projects folder:
            await settingsBrowsePanel.rightClickOnProjects();
            //Verify that 'New...' button should be enabled:
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("projects_context_menu");
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            //Verify that Edit,Delete menu items should be disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Edit');
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    it(`WHEN right click on 'Default' folder THEN 'New...' should be enabled , 'Delete' and 'Edit' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Do right click on 'Default' folder and Open Context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName("Default");
            //Verify that 'New...' button should be enabled:
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("default_context_menu");
            //2. Verify that New.. is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
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

    it(`GIVEN right click on existing project WHEN 'Delete' menu has been clicked AND 'Yes' clicked THEN project should be deleted`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Right click on the existing project:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            //2. Click on 'Delete' menu item:
            await settingsBrowsePanel.clickOnMenuItem("Delete");
            studioUtils.saveScreenshot("projects_context_menu_new");
            //3. Verify that the modal dialog is loaded:
            await confirmationDialog.waitForDialogOpened();
            //4. Click on 'Yes' button and delete the project:
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            studioUtils.saveScreenshot("projects_context_menu_new_deleted");
            let actualMessage = await settingsBrowsePanel.waitForNotificationMessage();
            assert.equal(actualMessage,
                appConst.projectDeletedMessage(PROJECT_DISPLAY_NAME_1, "Expected notification message should appear"));
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
