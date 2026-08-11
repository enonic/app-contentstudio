/**
 * Created on 04.04.2020.  updated on 10.08.2026
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

    const PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName('proj');
    const PROJECT_DISPLAY_NAME_2 = studioUtils.generateRandomName('proj');

    it(`WHEN two projects have been saved THEN 2 options should appear in the project selector`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Save 2 projects:
        await projectUtils.saveTestProject({
            name: PROJECT_DISPLAY_NAME_1,
            accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
        });
        await studioUtils.saveScreenshot('issue_project_1_saved');
        await projectUtils.saveTestProject({
            name: PROJECT_DISPLAY_NAME_2,
            accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
        });
        //await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME_2, DESCRIPTION);
        await studioUtils.saveScreenshot('issue_project_2_saved');
        // 2 .Click on Content app-mode button
        await studioUtils.switchToContentMode();
        // 3. Expand the project selector and verify that 2 new items appeared:
        let projectSelectionDialog = await contentBrowsePanel.clickOnProjectViewerButton();
        let result = await projectSelectionDialog.getProjectsDisplayName();
        await studioUtils.saveScreenshot('project_selection_dialog_new_projects');
        assert.ok(
            result.includes(PROJECT_DISPLAY_NAME_1),
            'Display name of the first project should be present in options',
        );
        assert.ok(
            result.includes(PROJECT_DISPLAY_NAME_2),
            'Display name of the second project should be present in options',
        );
    });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2708
    it(`WHEN two projects have been checked THEN 'Delete' button gets disabled`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        // 1. Click on both project's checkboxes:
        await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_1);
        await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
        // 2. Verify that 'Delete' button is disabled in settings toolbar:
        await settingsBrowsePanel.waitForDeleteButtonDisabled();
        // 'New' button should be enabled :
        await settingsBrowsePanel.waitForNewButtonEnabled();
        // 'Edit' button should be enabled:
        await settingsBrowsePanel.waitForEditButtonEnabled();
    });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/1466  Name of deleted project remains in Project Selector
    it(`WHEN existing project has been deleted THEN this project should be removed in options of Project Selector`, async () => {
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
        assert.ok(
            result.includes(PROJECT_DISPLAY_NAME_1) === false,
            'Deleted project should not be present in projectSelectionDialog',
        );
    });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
