/**
 * Created on 04.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('multiselect.in.settings.panel.spec - tests for selection of several items in setting browse panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName("project");
    let PROJECT_DISPLAY_NAME_2 = studioUtils.generateRandomName("project");
    let DESCRIPTION = "Test description";


    it(`WHEN two projects have been saved THEN 2 options should appear in the project selector`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Save 2 projects:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME_1, DESCRIPTION);
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME_2, DESCRIPTION);
            //2 .Click on Content app-mode button
            await studioUtils.switchToContentMode();
            //3. Expand the project selector and verify that 2 new items appeared:
            let projectSelectionDialog = await contentBrowsePanel.clickOnProjectViewerButton();
            let result = await projectSelectionDialog.getProjectsDisplayName();
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME_1), "Display name of the first project should be present in options");
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME_2), "Display name of the second project should be present in options");
        });

    //Verifies: Settings Panel - Error after trying to close several opened wizards #1632
    //https://github.com/enonic/app-contentstudio/issues/1632
    it(`GIVEN two projects are opened WHEN two tabs sequentially have been closed THEN there should not be a single item in the Tab Menu`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on both project's checkboxes:
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
            assert.equal(result, 0, "There should not be a single item in the Tab Bar");
        });

    it(`WHEN two existing projects are checked THEN Edit,New,Delete buttons should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on both project's checkboxes:
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
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //2. Open context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_2);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("multiselect_context_menu_1");
            //Verify that New.. item is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Edit');
            //Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('Delete');
        });

    it(`GIVEN Projects is expanded AND 'Selection Controller' checkbox is checked WHEN context menu has been opened THEN 'New' menu-item should be enabled but Delete,Edit items should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on 'Selection Controller' checkbox and select all project:
            await settingsBrowsePanel.clickOnSelectionControllerCheckbox();
            //2. Open context menu:
            await settingsBrowsePanel.rightClickOnProjectItemByDisplayName(PROJECT_DISPLAY_NAME_2);
            await settingsBrowsePanel.waitForContextMenuDisplayed();
            studioUtils.saveScreenshot("multiselect_context_menu_2");
            //Verify that New.. item is enabled:
            await settingsBrowsePanel.waitForContextMenuItemEnabled('New...');
            //Verify that Edit menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Edit');
            //Verify that Delete menu item is disabled:
            await settingsBrowsePanel.waitForContextMenuItemDisabled('Delete');
        });

    it(`GIVEN Projects folder is expanded AND two projects are checked WHEN 'Selection Toggler' has been clicked THEN two projects should remain in grid`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await settingsBrowsePanel.pause(1000);
            let actualResultBefore = await settingsBrowsePanel.getDisplayNames();
            //1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //2. Click on the circle(Selection Toggle):
            await settingsBrowsePanel.clickOnSelectionToggler();
            //3. get display names in the filtered grid:
            let actualResult = await settingsBrowsePanel.getDisplayNames();
            //4. Verify that number of items should be 2
            assert.equal(actualResult.length, 2, "Two project should remain in grid");
            //5. Verify display names in the filtered grid:
            assert.isTrue(actualResult.includes(PROJECT_DISPLAY_NAME_1), "Expected project should remains in grid");
            assert.isTrue(actualResult.includes(PROJECT_DISPLAY_NAME_2), "Expected project should remains in grid");
            assert.isAbove(actualResultBefore.length, actualResult.length, "Number of projects should be reduced");
        });

    //Verifies: https://github.com/enonic/app-contentstudio/issues/1701
    // Settings browse panel - errors after opening several filtered projects #1701
    it(`GIVEN 'Selection Toggler'(circle) has been clicked AND 2 projects are opened WHEN close-icon in opened tabs has been closed THEN two tabs should be closed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //2. Click on the circle(Selection Toggle):
            await settingsBrowsePanel.clickOnSelectionToggler();
            //3. Click on 'Edit' button and open 2 checked projects:
            await settingsBrowsePanel.clickOnEditButton();
            //4. Verify the number of opened tabs:
            let result = await settingsBrowsePanel.getNumberOpenedTabItems();
            assert.equal(result, 2, "Two tabs should be present in the tab bar");
            //4. Close the second tab:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME_2);
            //5. Close the first tab:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME_1);
            //6. Verify that all tabs are closed:
            result = await settingsBrowsePanel.getNumberOpenedTabItems();
            assert.equal(result, 0, "There should not be a single item in the Tab Bar");
        });

    //Verifies: https://github.com/enonic/app-contentstudio/issues/1466  Name of deleted project remains in Project Selector
    it(`WHEN existing project has been deleted THEN this project should be removed in options of Project Selector`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Delete the project:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME_1);
            await confirmValueDialog.clickOnConfirmButton();
            await contentBrowsePanel.pause(1000);
            //2 .Click on Content app-mode button and switch to content browse panel:
            await studioUtils.switchToContentMode();
            //3. Verify that deleted project is not present in projectSelectionDialog:
            let projectSelectionDialog = await contentBrowsePanel.clickOnProjectViewerButton();
            let result = await projectSelectionDialog.getProjectsDisplayName();
            assert.isFalse(result.includes(PROJECT_DISPLAY_NAME_1));
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
