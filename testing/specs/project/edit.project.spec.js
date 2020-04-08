/**
 * Created on 26.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');

describe('edit.project.spec - ui-tests for editing a project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let TEST_DESCRIPTION = "my description";
    let NEW_DESCRIPTION = "new description";

    it(`GIVEN a name and description has been typed WHEN 'Save' button has been pressed THEN all data should be saved`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Expand Projects-folder then Open new project wizard:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            await settingsBrowsePanel.openProjectWizard();
            //2. Type a name and description then click on 'Save' button:
            await projectWizard.typeName(PROJECT_DISPLAY_NAME);
            await projectWizard.typeDescription(TEST_DESCRIPTION);
            await projectWizard.selectReadAccess("Private");
            await projectWizard.waitAndClickOnSave();
            //3. verify the saved data:
            let actualDescription = await projectWizard.getDescription();
            assert.equal(actualDescription, TEST_DESCRIPTION, "Expected description should be displayed");
            let actualProjectName = await projectWizard.getProjectName();
            assert.equal(actualProjectName, PROJECT_DISPLAY_NAME, "Expected project name should be displayed");
        });

    it(`GIVEN existing project is opened WHEN description has been updated THEN new description should be displayed in browse panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Expand Projects-folder then Open new project wizard:
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //3. Verify that project name input is disabled:
            await projectWizard.waitForProjectNameInputDisabled();
            //4. Update the description:
            await projectWizard.typeDescription(NEW_DESCRIPTION);
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            //5. Verify the notification message:
            assert.equal(actualMessage, appConstant.projectModifiedMessage(PROJECT_DISPLAY_NAME));
            //6. Click on 'close-icon' button and close the wizard:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME);
            //7. Verify that the description is updated in Browse Panel:
            studioUtils.saveScreenshot("project_description_updated");
            let actualDescription = await settingsBrowsePanel.getProjectDescription(PROJECT_DISPLAY_NAME);
            assert.equal(actualDescription, NEW_DESCRIPTION, "Description should be updated in grid");
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
