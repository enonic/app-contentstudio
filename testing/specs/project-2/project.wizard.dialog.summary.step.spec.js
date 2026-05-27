/**
 * Created on 31.08.2022 updated  on 27.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ConfirmationDialog = require("../../page_objects/confirmation.dialog");
const ProjectWizardDialogSummaryStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.summary.step");
const ProjectWizardDialogNameAndIdStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step");

describe('project.wizard.dialog.summary.step.spec - ui-tests for Summary wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');

    it(`WHEN Summary step wizard is loaded THEN expected parameters should be displayed`,
        async () => {
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            let parentProjectAndLanguageStep = new ProjectWizardDialogParentProjectStep();
            await parentProjectAndLanguageStep.waitForLoaded();
            // 2. Select 'Default' project and go to 'Name/ID' step
            await parentProjectAndLanguageStep.selectParentProject('Default');
            // 3. Select the language
            await parentProjectAndLanguageStep.selectLanguage(appConst.LANGUAGES.EN);
            await parentProjectAndLanguageStep.clickOnNextButton();
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            // 4. Fill in the name and description inputs:
            await nameAndIdStep.typeDisplayName(PROJECT_DISPLAY_NAME);
            await nameAndIdStep.typeDescription('test');
            await nameAndIdStep.clickOnNextButton();


            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await accessModeStep.clickOnNextButton();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            await permissionsStep.waitForLoaded();
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            await permissionsStep.clickOnNextButton();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnNextButton();
            }
            let summaryStep = new ProjectWizardDialogSummaryStep();
            await summaryStep.waitForLoaded();
            await studioUtils.saveScreenshot('summary_step');
            // 6. Verify all parameters in the step:
            let actualAccessMode = await summaryStep.getAccessMode();
            assert.equal(actualAccessMode, 'Private', "'Private' access mode should be displayed");
            let actualProjectName = await summaryStep.getProjectName();
            assert.ok(actualProjectName.includes(PROJECT_DISPLAY_NAME), "Expected project name should be displayed in the Step");
            let actualParentProject = await summaryStep.getParentProjectName();
            assert.equal(actualParentProject, 'Default (default)');
            let actualDefaultLanguage = await summaryStep.getDefaultLanguage();
            assert.equal(actualDefaultLanguage, appConst.LANGUAGES.EN, "Expected language should be displayed");
            // TODO
            //let actualDescription = await summaryStep.getDescription();
            let actualPermissions = await summaryStep.getPermissions();
            assert.equal(actualPermissions[0], 'Contributor', "Contributor permission should be displayed");
            // 7. Verify that 'Previous' button is displayed
            await summaryStep.waitForPreviousButtonDisplayed();
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
