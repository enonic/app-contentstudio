/**
 * Created on 04.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');


describe('multiselect.in.settings.panel.spec - tests for selection of several items in setting browse panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName("project");
    let PROJECT_DISPLAY_NAME_2 = studioUtils.generateRandomName("project");
    let DESCRIPTION = "Test description";


    it(`Preconditions: 2 projects should be added`,
        async () => {
            //1. Save 2 projects:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME_1, DESCRIPTION);
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME_2, DESCRIPTION);
        });

    //Verifies: Settings Panel - Error after trying to close several opened wizards #1632
    //https://github.com/enonic/app-contentstudio/issues/1632
    it(`GIVEN two projects are opened WHEN two tabs sequentially have been closed THEN there should not be a single item in the Tab Menu`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //2. Click on 'Edit' button:
            await settingsBrowsePanel.clickOnEditButton();
            //3. Verify the number of opened tabs:
            let result = await settingsBrowsePanel.getNumberOpenedTabItems();
            assert.equal(result, 2, "Two tabs should be present in the tab bar");
            //4. Close the second tab:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME_2);
            //5. Close the first tab:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME_1);
            //6. Verify that all tabs are closed:
            result = await settingsBrowsePanel.getNumberOpenedTabItems();
            assert.equal(result, 0, "There should not be a single item in the Tab");
        });


    it(`WHEN two existing projects are checked THEN Edit,New,Delete buttons should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //'New...' button should be enabled :
            await settingsBrowsePanel.waitForNewButtonEnabled();
            //'Delete' button should be disabled
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
            //'Edit' button should be disabled:
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    it(`GIVEN two existing projects are checked WHEN context menu has been opened THEN Edit,New,Delete items should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on both just created project's checkboxes:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //2. Open context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_2);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("multiselect_context_menu_1");
            //Verify that New.. item is enabled:
            let result = await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            //Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Delete');
        });

    it(`GIVEN Projects is expanded AND Selection Controller checkbox is checked WHEN context menu has been opened THEN New item should be enabled but Delete,Edit items should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Expand Projects folder then click Selection Controller checkbox and select all project:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            await settingsBrowsePanel.clickOnSelectionControllerCheckbox(PROJECT_DISPLAY_NAME_1);
            //2. Open context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_2);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("multiselect_context_menu_2");
            //Verify that New.. item is enabled:
            let result = await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            //Verify that Edit menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Edit');
            //Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
