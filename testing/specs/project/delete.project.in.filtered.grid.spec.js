/**
 * Created on 27.05.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe("delete.project.in.filtered.grid.spec - Delete projects in filtered grid", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME_1 = studioUtils.generateRandomName("project");
    let PROJECT_DISPLAY_NAME_2 = studioUtils.generateRandomName("project");
    let DESCRIPTION = "Test description";


    it(`Preconditions: 2 projects should be added`,
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

    //Verifies https://github.com/enonic/app-contentstudio/issues/2708
    it(`WHEN two projects have been checked THEN 'Delete' button gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Click on both project's checkboxes:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME_2);
            //2. Verify that 'Delete' button is disabled in settings toolbar:
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    //Verifies: Selection Controller is not refreshed after selected projects have been removed #1828
    //https://github.com/enonic/app-contentstudio/issues/1828
    it(`GIVEN two projects are checked and 'Show Selection' is clicked WHEN these projects have been deleted THEN 'Selection toggler' gets not visible`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Click on the project's checkbox:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME_1);
            //2. Click on 'Show Selection' button:
            await settingsBrowsePanel.clickOnSelectionToggler();
            //3. Click on Delete button:
            await settingsBrowsePanel.clickOnDeleteButton();
            //4. Verify that Confirmation Dialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME_1);
            //5. Click on Yes button and delete folders:
            await confirmValueDialog.clickOnConfirmButton();
            await settingsBrowsePanel.pause(300);
            //6. Verify that Selection Controller is not visible:
            await settingsBrowsePanel.waitForSelectionTogglerNotVisible();
            //7. Verify that selection controller checkbox is not selected :
            let result = await settingsBrowsePanel.isSelectionControllerSelected();
            assert.isFalse(result, "Selection Controller checkBox gets unselected");
            result = await settingsBrowsePanel.isSelectionControllerPartial();
            assert.isFalse(result, "Selection Controller checkBox gets unselected");
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
