/**
 * Created on 03.09.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');

describe('project.wizard.dialog.applications.step.spec - ui-tests for Applications wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN wizard dialog is opened WHEN navigated to Applications wizard step THEN 'Skip' button should be enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Select 'Default' project and go to 'Applications' step
            await parentProjectStep.clickOnLayerRadioButton();
            await parentProjectStep.selectParentProject("Default");
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            //3. Verify that 'Skip' button is enabled in Applications step
            await applicationsStep.waitForSkipButtonEnabled();
            //4. Select an application:
            await applicationsStep.selectApplication(appConst.APP_CONTENT_TYPES);
            await studioUtils.saveScreenshot("proj_wizard_app_selected");
            //5. Verify that 'Next' button gets visible:
            await applicationsStep.waitForNextButtonEnabled();
            //6. Click on remove icon:
            await applicationsStep.removeApplication(appConst.APP_CONTENT_TYPES);
            //7. Verify that 'Skip' button appears again:
            await applicationsStep.waitForSkipButtonEnabled();
        });

    it(`GIVEN application is selected in the step WHEN go to the next step then go back to the previous step THEN selected application should be present in the app-step`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            //1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            //2. Select 'Default' project and go to 'Applications' step
            await parentProjectStep.clickOnLayerRadioButton();
            await parentProjectStep.selectParentProject("Default");
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            //3. Verify that 'Skip' button is enabled in Applications step
            await applicationsStep.waitForSkipButtonEnabled();
            //4. Select an application:
            await applicationsStep.selectApplication(appConst.APP_CONTENT_TYPES);
            //5. Go to Name/Id step:
            await applicationsStep.clickOnNextButton();
            await nameIdStep.waitForLoaded();
            //6. Go back to the previous step:
            await nameIdStep.clickOnBackButton();
            await studioUtils.saveScreenshot("proj_wizard_app_previous_step");
            //7. Verify that application is displayed after returning to this step:
            let applications = await applicationsStep.getSelectedApplications();
            assert.equal(applications[0], appConst.APP_CONTENT_TYPES, "Expected application should be displayed in the step");
            //8. Verify that 'Next' button is displayed again:
            await applicationsStep.waitForNextButtonEnabled();
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
