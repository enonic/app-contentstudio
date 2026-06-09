const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectNotAvailableDialog = require('../../page_objects/project/project.not.available.dialog');
const ProjectWizardDialogNameAndIdStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step");
const ProjectWizardDialogAccessModeStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step");
const ProjectWizardDialogPermissionsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step");
const ProjectWizardDialogSummaryStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.summary.step");
const LanguageAndParentProjectStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step");

describe("project.recreate.spec - tests for recreating the only one project ", function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PROJECT_DEFAULT_NAME = 'Default';

    // Settings Panel is not refreshed after creating the first project in empty grid #7646
    // https://github.com/enonic/app-contentstudio/issues/7646
    it("GIVEN the only one existing project has been deleted then recreated THEN the project should be displayed in Setting Panel",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageAndParentProjectStep = new LanguageAndParentProjectStep();
            // 1. Open Setting panel
            await studioUtils.openSettingsPanel();
            // 2. Select and delete the project:
            await projectUtils.selectAndDeleteProject(PROJECT_DEFAULT_NAME, 'default');
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            // 3. Verify that Project Not Available modal Dialog is automatically loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
            // 4. Open the wizard:
            await projectNotAvailableDialog.clickOnStartWizardButton();
            await projectNotAvailableDialog.waitForDialogClosed();
            await languageAndParentProjectStep.waitForLoaded();
            await languageAndParentProjectStep.clickOnNextButton();

            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            await projectUtils.fillNameAndDescriptionStep("Default");
            await nameAndIdStep.clickOnNextButton();

            // 5. Select 'Private' access mode in the step:
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            await accessModeStep.waitForLoaded();
            await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();

            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            await permissionsStep.waitForLoaded();
            await permissionsStep.clickOnNextButton();

            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnNextButton();
            }

            let summaryStep = new ProjectWizardDialogSummaryStep();
            await summaryStep.waitForLoaded();
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshotUniqueName('verify_issue_7646')
            await settingsBrowsePanel.waitForProjectByDisplayNameDisplayed('Default');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
