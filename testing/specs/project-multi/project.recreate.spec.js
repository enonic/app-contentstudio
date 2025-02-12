const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectNotAvailableDialog = require('../../page_objects/project/project.not.available.dialog');

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
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
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
            // 5. Skip the language step
            await languageStep.waitForLoaded();
            await languageStep.clickOnSkipButton();
            // 6. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 7. skip the permissions step:
            await permissionsStep.clickOnSkipButton();
            // 8. Skip the applications step
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            // 9. Fill in the name input
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(PROJECT_DEFAULT_NAME);
            await summaryStep.waitForLoaded();
            // 10. Click on 'Create Project' button and wait for the wizard-dialog is closed:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshotUniqueName('verify_issue_7646')
            await settingsBrowsePanel.waitForProjectByDisplayNameVisible('Default');
        });

    beforeEach(() => studioUtils.navigateToContentStudioWithProjects());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
