/**
 * Created on 20.03.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');

describe('settings.browse.panel.context.menu.spec - ui-tests to verify context menu items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName('project');

    it(`Preconditions: new project should be added`,
        async () => {
            // 1. Save new project:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME_1, 'description');
        });

    it(`WHEN right click on 'Projects' folder THEN 'New...' should be enabled , 'Delete' and 'Edit' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Go to Settings Panel and do a right click on Projects folder:
            await settingsBrowsePanel.rightClickOnProjects();
            // Verify that 'New...' button should be enabled:
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            await studioUtils.saveScreenshot("projects_context_menu");
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            // Verify that Edit,Delete menu items should be disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Edit');
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    it(`WHEN right click on 'Default' folder THEN 'New...' should be enabled , 'Delete' and 'Edit' are disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Do a right click on 'Default' folder and Open Context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName('Default');
            // Verify that 'New...' button should be enabled:
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            await studioUtils.saveScreenshot('default_context_menu');
            // 2. Verify that 'New...' is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            // Verify that Delete menu item is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Delete');
        });

    it(`GIVEN right click on Projects folder WHEN 'New..' menu has been clicked THEN 'New Settings Item Dialog' should be loaded`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            // 1. Go to Settings Panel and do a right click on Projects folder:
            await settingsBrowsePanel.rightClickOnProjects();
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            // 2. Click on 'New...' menu item:
            await settingsBrowsePanel.clickOnMenuItem("New...");
            await studioUtils.saveScreenshot('projects_context_menu_new');
            // 3. Verify that the modal dialog is loaded:
            await parentProjectStep.waitForLoaded();
        });

    it(`GIVEN right click on existing project WHEN 'Delete' menu has been clicked AND 'Yes' clicked THEN project should be deleted`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. Do a Right click on the existing project:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            // 2. Click on 'Delete' menu item:
            await settingsBrowsePanel.clickOnMenuItem('Delete');
            await studioUtils.saveScreenshot('projects_context_menu_new');
            // 3. Verify that the modal dialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME_1);
            // 4. Click on 'Confirm' button and delete the project:
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('projects_context_menu_new_deleted');
            let actualMessage = await settingsBrowsePanel.waitForNotificationMessage();
            assert.equal(actualMessage,
                appConst.projectDeletedMessage(PROJECT_DISPLAY_NAME_1, "Expected notification message should appear"));
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
