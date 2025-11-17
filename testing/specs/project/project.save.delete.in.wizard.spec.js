/**
 * Created on 24.03.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');

describe('project.save.delete.in.wizard.panel.spec - ui-tests for saving/deleting a project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`GIVEN required inputs in project wizard are filled WHEN 'Save' button has been pressed THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.'Open new wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            let project = projectUtils.buildProject(null, appConst.PROJECT_ACCESS_MODE.PRIVATE, null, null, PROJECT_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(project);
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it(`GIVEN new project wizard dialog is opened WHEN fill in the Identifier input with a name that is already being used by existing project THEN Next button gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            // 1.'Open new wizard dialog:
            let parentProjectStep = await settingsBrowsePanel.openProjectWizardDialog();
            // 2. click on Skip button:
            await parentProjectStep.clickOnSkipButton();
            // 3. Skip the language step:
            await languageStep.clickOnSkipButton();
            // 4. Select Private access mode:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            // 5. Slip the permissions step
            await permissionsStep.waitForLoaded();
            await permissionsStep.clickOnSkipButton();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            // 6. Insert the existing identifier:
            await nameAndIdStep.waitForLoaded();
            await nameAndIdStep.typeDisplayName(PROJECT_DISPLAY_NAME);
            await studioUtils.saveScreenshot("project_name_validation_1");
            // 7. Verify that 'Next' button gets disabled:
            await nameAndIdStep.waitForNextButtonDisabled();
            // 8. Verify the validation message for Identifier input: "Project name is occupied"
            let actualMessage = await nameAndIdStep.getProjectIdentifierValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.PROJECT_IS_OCCUPIED, "Expected this message should appear");
            // 9. Add "1" at the end of identifier:
            await nameAndIdStep.addTextInProjectIdentifierInput('1');
            await studioUtils.saveScreenshot("project_name_validation_1");
            // 10. Verify that Next button gets enabled:
            await nameAndIdStep.waitForNextButtonEnabled();
            await nameAndIdStep.waitForProjectIdentifierValidationMessageNotVisible();
        });

    it("GIVEN a project is selected and 'Delete' button pressed AND Confirm Value dialog is opened WHEN incorrect identifier has been typed THEN 'Confirm' button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1.Open the project:
            await settingsBrowsePanel.openProjectByDisplayName(PROJECT_DISPLAY_NAME);
            // 2. Click on 'Delete' button
            await projectWizard.clickOnDeleteButton();
            // 3. Verify that 'Confirmation Dialog' is loaded:
            await confirmValueDialog.waitForDialogOpened();
            // 4. Incorrect identifier has been typed:
            await confirmValueDialog.typeNumberOrName('test project');
            // 5. Verify that 'Confirm' button is disabled
            await confirmValueDialog.waitForConfirmButtonDisabled();
        });

    it(`GIVEN existing project is selected WHEN the project has been deleted THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1.Open the Project:
            await settingsBrowsePanel.openProjectByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. Verify that Delete button gets enabled, then click on it
            await projectWizard.clickOnDeleteButton();
            // 4. Verify that Confirmation Dialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            // 5. Click on Confirm button:
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            // 6. Verify the notification message:
            let actualMessage = await settingsBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot('project_deleted_2');
            assert.equal(actualMessage, appConst.projectDeletedMessage(PROJECT_DISPLAY_NAME))
        });


    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
