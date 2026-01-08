/**
 * Created on 12.07.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectNotAvailableDialog = require('../../page_objects/project/project.not.available.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const lib = require('../../libs/elements-old');

describe("project.not.available.dialog.spec - clicking on 'Start Wizard' button", function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it.skip("GIVEN navigated to Content Studio, No available projects found- dialog is shown WHEN 'Start Wizard' button has been pressed THEN project wizard should be loaded",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            // 1. Project Not Available Dialog should be loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
            await projectUtils.saveScreenshot('not_available_modal_dialog');
            // 2. Click on Start button in the modal dialog:
            await projectNotAvailableDialog.clickOnStartWizardButton();
            await projectNotAvailableDialog.waitForDialogClosed();
            // 3. Skip the language step
            await languageStep.waitForLoaded();
            await languageStep.clickOnSkipButton();
            // 4. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 5. skip the permissions step:
            await permissionsStep.clickOnSkipButton();
            // 6. Skip the applications step
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            // 7. Fill in the name input
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(PROJECT_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            // 8. Click on 'Create Project' button and wait for the dialog is closed:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            // 9. project-context should be loaded after creating a project:
            let currentContext = await contentBrowsePanel.getCurrentProjectDisplayName();
            assert.equal(currentContext, PROJECT_DISPLAY_NAME, 'Expected current project should be displayed in the project viewer in Browse Panel');
        });

    it.skip("GIVEN existing the only one project has been deleted THEN 'project not available' modal dialog should be loaded",
        async () => {
            // 1. Open Setting panel
            await studioUtils.openSettingsPanel();
            // 2. Select and delete the project:
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            await projectUtils.saveScreenshot('the_only_one_project_deleted');
            // 3. Verify that Project Not Available modal Dialog is automatically loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
        });

    it.skip("GIVEN 'Start Wizard' button in 'not available project' modal dialog has been pressed WHEN the project wizard has been closed THEN 'Start Wizard' action button gets visible",
        async () => {
            let languageStep = new ProjectWizardDialogLanguageStep();
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            // 1. Project Not Available Dialog should be loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
            await projectUtils.saveScreenshot('not_available_modal_dialog');
            // 2. Click on 'Start Wizard' button in the modal dialog:
            await projectNotAvailableDialog.clickOnStartWizardButton();
            // 3. Click on Cancel button in the language step:
            await languageStep.waitForLoaded();
            await languageStep.clickOnCancelButtonTop();
            await languageStep.waitForDialogClosed();
            // 4. Action button 'Start Wizard' should be loaded:
            let locator = lib.actionButton('Start Wizard');
            await projectUtils.waitForElementDisplayed(locator, appConst.mediumTimeout);
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
