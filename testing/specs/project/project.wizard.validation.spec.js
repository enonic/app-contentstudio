/**
 * Created on 02.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('project.wizard.validation.spec - validation specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");

    it(`GIVEN name and 'Read access' are filled WHEN the project name contains a white space THEN 'Save' should be disabled and error message gets visible`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeName(PROJECT_DISPLAY_NAME);
            await projectWizard.selectReadAccess("Public");
            //2. Type a project-name with white space:
            await projectWizard.typeInProjectName("my project");
            //3. Verify that 'Save' button gets disabled:
            await projectWizard.waitForSaveButtonDisabled();
            studioUtils.saveScreenshot("project_validation_1");
            let errorMessage = await projectWizard.getProjectNameValidationMessage();
            assert.equal(errorMessage, "Invalid value entered", "Expected validation message gets visible");
        });

    it(`GIVEN project name contains a white space WHEN the name has been corrected THEN 'Save' gets enabled AND error message gets not visible`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'Open new wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeName(PROJECT_DISPLAY_NAME);
            await projectWizard.selectReadAccess("Custom");
            //2. Type a project-name with white space:
            await projectWizard.typeInProjectName("my project");
            //3. Verify that 'Save' button gets disabled:
            await projectWizard.waitForSaveButtonDisabled();
            //4. The project-name has been corrected:
            await projectWizard.typeInProjectName("my_project");
            studioUtils.saveScreenshot("project_validation_1");
            //5. Verify that validation message gets not visible and Save gets enabled:
            await projectWizard.getProjectNameValidationMessageNotVisible();
            await projectWizard.waitForSaveButtonEnabled();
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
