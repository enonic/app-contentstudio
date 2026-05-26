/**
 * Created on 03.09.2022  updated 0n 25.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');

describe('project.wizard.dialog.applications.step.spec - ui-tests for Applications wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN Default project is selected in parent step WHEN an app has been selected in Applications step THEN 'Copy from default' button should not be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select 'Default' project and go to 'Applications' step
            await parentProjectAndLanguageStep.selectParentProject(appConst.PROJECTS.DEFAULT_PROJECT_NAME);
            await parentProjectAndLanguageStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 3. Next button should be disabled
            await nameAndIdStep.waitForNextButtonDisabled();
            // 4. Fill in the name input
            await nameAndIdStep.typeDisplayName(appConst.generateRandomName('name'));
            // 5. Next button should be enabled now:
            await nameAndIdStep.clickOnNextButton();
            // 6. This button is displayed because none of the three radio buttons is selected.
            await accessModeStep.clickOnCopyFromParentButton('Default');
            await accessModeStep.clickOnNextButton();
            await permissionsStep.waitForLoaded();
            await permissionsStep.clickOnNextButton();
            await applicationsStep.waitForLoaded();
            // 7. Select an application:
            await applicationsStep.selectApplication(appConst.APP_CONTENT_TYPES);
            await studioUtils.saveScreenshot('proj_wizard_app_selected');
            await applicationsStep.waitForCopyFromParentButtonNotDisplayed('Default');
            await applicationsStep.waitForNextButtonEnabled();
        });

    it(`WHEN single app has been removed in Applications step THEN Applications should not be displayed in the selected options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select 'Default' project and go to 'Applications' step
            await parentProjectAndLanguageStep.selectParentProject(appConst.PROJECTS.DEFAULT_PROJECT_NAME);
            await parentProjectAndLanguageStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();

            await nameAndIdStep.typeDisplayName(appConst.generateRandomName('name'));
            await nameAndIdStep.clickOnNextButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.waitForLoaded();
            await permissionsStep.clickOnNextButton();
            await applicationsStep.waitForLoaded();
            // 3. Verify that 'Next' button is enabled in 'Applications step'
            await applicationsStep.waitForNextButtonEnabled();
            // 4. Select an application:
            await applicationsStep.selectApplication(appConst.APP_CONTENT_TYPES);
            await studioUtils.saveScreenshot('proj_wizard_app_selected');
            let applications = await applicationsStep.getSelectedApplications();
            assert.equal(applications[0], appConst.APP_CONTENT_TYPES, "Expected application should be displayed in the step");
            // 5. Click on  'Previous' button:
            await applicationsStep.clickOnPreviousButton();
            await permissionsStep.waitForLoaded();
            // 6. Click on 'Next' button
            await permissionsStep.clickOnNextButton();
            // 7. The application is still visible , Click on remove icon:
            await applicationsStep.removeApplication(appConst.APP_CONTENT_TYPES);
            // 8. Applications should not be displayed in the selected options:
            await applicationsStep.waitForNextButtonEnabled();
            applications = await applicationsStep.getSelectedApplications();
            assert.ok(applications.length === 0, 'Applications should not be displayed in the selected options');
        });

    beforeEach(async () => {
        // selects Default context
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
