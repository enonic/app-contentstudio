/**
 * Created on 31.08.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');

describe('project.wizard.dialog.summary.step.spec - ui-tests for Summary wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`WHEN Summary step wizard is loaded THEN expected parameters should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            // 1.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select Default project:
            await parentProjectStep.clickOnLayerRadioButton();
            await parentProjectStep.selectParentProject("Default");
            await parentProjectStep.clickOnNextButton();
            // 3. Select the language:
            await languageStep.selectLanguage(appConst.LANGUAGES.EN);
            await languageStep.clickOnNextButton();
            // 4. Select Private access mode:
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await accessModeStep.clickOnNextButton();
            // 5. Add contributor:
            await permissionsStep.selectProjectAccessRole(appConst.systemUsersDisplayName.SUPER_USER);
            await permissionsStep.clickOnNextButton();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(PROJECT_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            await studioUtils.saveScreenshot('summary_step');
            // 6. Verify all parameters in the step:
            let actualAccessMode = await summaryStep.getAccessMode();
            assert.equal(actualAccessMode, 'Private', "'Private' access mode should be displayed");
            let actualProjectName = await summaryStep.getProjectName();
            assert.isTrue(actualProjectName.includes(PROJECT_DISPLAY_NAME), "Expected project name should be displayed in the Step");
            let actualParentProject = await summaryStep.getParentProjectName();
            assert.equal(actualParentProject, 'Default (default)');
            let actualDefaultLanguage = await summaryStep.getDefaultLanguage();
            assert.equal(actualDefaultLanguage, appConst.LANGUAGES.EN, "Expected language should be displayed");
            // 7. Verify that 'Back' button is displayed
            await summaryStep.waitForBackButtonDisplayed();
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
