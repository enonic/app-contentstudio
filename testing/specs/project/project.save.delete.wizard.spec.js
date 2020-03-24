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
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('project.save.delete.wizard.panel.spec - ui-tests for saving/deleting a project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");

    it(`GIVEN required inputs in project wizard are filled WHEN 'Save' button has been pressed THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type a name:
            await projectWizard.typeName(PROJECT_DISPLAY_NAME);
            //2. Verify that Save button gets enabled, then click on it
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_saved_1");
            assert.equal(actualMessage, appConstant.projectCreatedMessage(PROJECT_DISPLAY_NAME))
        });

    it(`GIVEN existing project is selected WHEN the project has been deleted THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.Expand the root folder:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2. click on the project:
            await settingsBrowsePanel.clickCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that Delete button gets enabled, then click on it
            await settingsBrowsePanel.clickOnDeleteButton();
            //4. Verify that Confirmation Dialog is loaded:
            await confirmationDialog.waitForDialogOpened();
            //5. Click on Yes button:
            await confirmationDialog.clickOnYesButton();
            //6. Verify the notification message:
            let actualMessage = await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_deleted_1");
            assert.equal(actualMessage, appConstant.projectDeletedMessage(PROJECT_DISPLAY_NAME))
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
