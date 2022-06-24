/**
 * Created on 24.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');

describe('project.save.delete.grid.panel.spec - ui-tests for saving/deleting a project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");

    //verifies #1627 "Settings browse panel - grid is not refreshed after saving new project"
    it(`GIVEN a name has been saved in new Project wizard WHEN 'Home' button has been pressed THEN new project should appear beneath 'Projects' folder`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await settingsBrowsePanel.openProjectWizard();
            //1. Type a display name then click on Save button:
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            //2. Click on 'Home' button and go to the grid:
            await settingsBrowsePanel.clickOnHomeButton();
            //3. Verify the issue #1627:
            await studioUtils.saveScreenshot("home_button_project_saved_4");
            await settingsBrowsePanel.waitForItemByDisplayNameDisplayed(PROJECT_DISPLAY_NAME);
            //4. Verify that 'Sync' button gets visible and enabled:
            await settingsBrowsePanel.waitForSyncButtonEnabled();
        });

    it("WHEN 'Sync' button has been pressed THEN expected notification messages appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await settingsBrowsePanel.clickOnSyncButton();
            let messages = await settingsBrowsePanel.waitForNotificationMessages();
            assert.equal(messages[0], appConst.PROJECT_SYNC.STARTED, "Expected message should be displayed");
            assert.equal(messages[1], appConst.PROJECT_SYNC.FINISHED, "Expected message should be displayed")
        });

    it(`GIVEN existing project is selected WHEN the project has been deleted THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. click on the project:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME);
            //2. Verify that Delete button gets enabled, then click on it
            await settingsBrowsePanel.clickOnDeleteButton();
            //3. Verify that Confirmation Dialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME);
            //4. Click on Confirm button:
            await confirmValueDialog.clickOnConfirmButton();
            //5. Verify the notification message:
            let actualMessage = await settingsBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot("project_deleted_1");
            assert.equal(actualMessage, appConst.projectDeletedMessage(PROJECT_DISPLAY_NAME));
            //6. Verify that the project is not present in Browse Panel:
            await settingsBrowsePanel.waitForProjectNotDisplayed(PROJECT_DISPLAY_NAME);
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
