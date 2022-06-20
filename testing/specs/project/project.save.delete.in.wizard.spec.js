/**
 * Created on 24.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');

describe('project.save.delete.in.wizard.panel.spec - ui-tests for saving/deleting a project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");

    it(`GIVEN required inputs in project wizard are filled WHEN 'Save' button has been pressed THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type a display name and select the access mode:
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            //3. Verify that 'Save' button gets enabled, then click on it
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_saved_1");
            assert.equal(actualMessage, appConstant.projectCreatedMessage(PROJECT_DISPLAY_NAME))
        });

    it(`GIVEN new project wizard is opened WHEN try to save an name that is already being used by existing project THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type a display name that is already being used by existing project:
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            //3. Verify that `Save` button gets enabled, then click on it
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_name_already_used");
            assert.equal(actualMessage, appConstant.projectNameAlreadyExistsMessage(PROJECT_DISPLAY_NAME))
        });

    it("GIVEN a project is selected and 'Delete' button pressed AND Confirm Value dialog is opened WHEN incorrect identifier has been typed THEN 'Confirm' button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmValueDialog = new ConfirmValueDialog();
            //1.Open the project:
            await settingsBrowsePanel.openProjectByDisplayName(PROJECT_DISPLAY_NAME);
            //2. Click on 'Delete' button
            await projectWizard.clickOnDeleteButton();
            //3. Verify that 'Confirmation Dialog' is loaded:
            await confirmValueDialog.waitForDialogOpened();
            //4. Incorrect identifier has been typed:
            await confirmValueDialog.typeNumberOrName("test project");
            //5. Verify that 'Confirm' button is disabled
            await confirmValueDialog.waitForConfirmButtonDisabled();
        });

    it(`GIVEN existing project is selected WHEN the project has been deleted THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmValueDialog = new ConfirmValueDialog();
            //1.Open the Project:
            await settingsBrowsePanel.openProjectByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that Delete button gets enabled, then click on it
            await projectWizard.clickOnDeleteButton();
            //4. Verify that Confirmation Dialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            //5. Click on Confirm button:
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            //6. Verify the notification message:
            let actualMessage = await settingsBrowsePanel.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_deleted_2");
            assert.equal(actualMessage, appConstant.projectDeletedMessage(PROJECT_DISPLAY_NAME))
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/1946
    it(`WHEN 'Default' project is opened THEN 'Save' and 'Delete' buttons should be disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. click on Default folder then click on Edit button:
            await settingsBrowsePanel.clickOnRowByDisplayName("Default");
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.waitForSaveButtonDisabled();
            await projectWizard.waitForDeleteButtonDisabled();
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
