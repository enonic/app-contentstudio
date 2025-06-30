/**
 * Created on 04.04.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('multiselect.in.settings.panel.spec - tests for selection of several items in setting browse panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName('project');
    const PROJECT_DISPLAY_NAME_2 = studioUtils.generateRandomName('project');
    const DESCRIPTION = "Test description";


    it(`WHEN two projects have been saved THEN 2 options should appear in the project selector`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Save 2 projects:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME_1, DESCRIPTION);
            await studioUtils.saveScreenshot('issue_project_1_saved');
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME_2, DESCRIPTION);
            await studioUtils.saveScreenshot('issue_project_2_saved');
            // 2 .Click on Content app-mode button
            await studioUtils.switchToContentMode();
            // 3. Expand the project selector and verify that 2 new items appeared:
            let projectSelectionDialog = await contentBrowsePanel.clickOnProjectViewerButton();
            let result = await projectSelectionDialog.getProjectsDisplayName();
            await studioUtils.saveScreenshot('project_selection_dialog_new_projects');
            assert.ok(result.includes(PROJECT_DISPLAY_NAME_1), "Display name of the first project should be present in options");
            assert.ok(result.includes(PROJECT_DISPLAY_NAME_2), "Display name of the second project should be present in options");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2708
    it(`WHEN two projects have been checked THEN 'Delete' button gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            // 2. Verify that 'Delete' button is disabled in settings toolbar:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    // Verifies: Settings Panel - Error after trying to close several opened wizards #1632
    // https://github.com/enonic/app-contentstudio/issues/1632
    it(`GIVEN two projects are opened WHEN two tabs sequentially have been closed THEN there should not be a single item in the Tab Menu`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            // 2. Click on 'Edit' button:
            await settingsBrowsePanel.clickOnEditButton();
            // 3. Verify the number of opened tabs:
            let result = await settingsBrowsePanel.getNumberOpenedTabItems();
            assert.equal(result, 2, "Two tabs should be present in the tab bar");
            // 4. Close the second tab:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME_2);
            // 5. Close the first tab:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME_1);
            // 6. Verify that all tabs are closed:
            result = await settingsBrowsePanel.getNumberOpenedTabItems();
            assert.equal(result, 0, "There should not be a single item in the Tab Bar");
        });

    it(`WHEN two existing projects are checked THEN Edit,New,Delete buttons should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            // 'New...' button should be enabled :
            await settingsBrowsePanel.waitForNewButtonEnabled();
            // 'Delete' button should be disabled:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            // 'Edit' button should be enabled:
            await settingsBrowsePanel.waitForEditButtonEnabled();
        });

    it(`GIVEN two existing projects are checked WHEN context menu has been opened THEN Edit,New,Delete items should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Click on both just created project's checkboxes:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            // 2. Open context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_2);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            await studioUtils.saveScreenshot("multiselect_context_menu_1");
            // Verify that New.. item is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            // Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    it(`GIVEN Projects is expanded AND 'Selection Controller' checkbox is checked WHEN context menu has been opened THEN 'New' menu-item should be enabled but Delete,Edit items should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Click on 'Selection Controller' checkbox and select all project:
            await settingsBrowsePanel.clickOnSelectionControllerCheckbox();
            // 2. Open context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_2);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            await studioUtils.saveScreenshot('multiselect_context_menu_2');
            // Verify that New.. item is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            // Verify that Edit menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Edit');
            // Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/1466  Name of deleted project remains in Project Selector
    it(`WHEN existing project has been deleted THEN this project should be removed in options of Project Selector`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Delete the project:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME_1);
            await confirmValueDialog.clickOnConfirmButton();
            await contentBrowsePanel.pause(1000);
            // 2 .Click on Content app-mode button and switch to content browse panel:
            await studioUtils.switchToContentMode();
            // 3. Verify that deleted project is not present in projectSelectionDialog:
            let projectSelectionDialog = await contentBrowsePanel.clickOnProjectViewerButton();
            let result = await projectSelectionDialog.getProjectsDisplayName();
            assert.ok(result.includes(PROJECT_DISPLAY_NAME_1) === false, "Deleted project should not be present in projectSelectionDialog");
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
