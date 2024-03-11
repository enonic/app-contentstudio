/**
 * Created on 07.02.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');
const ProjectWizardDialogSummaryStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.summary.step');
const LayerWizardPanel = require('../../page_objects/project/layer.wizard.panel');

describe('project.wizard.two.apps.spec - Select 2 applications in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');

    it(`GIVEN project with two selected apps is opened THEN expected application should be present in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let applications = [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES, appConst.TEST_APPS_NAME.APP_WITH_METADATA_MIXIN];
            // 1. Save new project with two applications:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'test description', null, null, 'Private', applications);
            // 2. Select the row and click on 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 3. Go to Applications step form in the wizard page:
            await projectWizard.clickOnWizardStep('Applications');
            await studioUtils.saveScreenshot('proj_wizard_2_selected_apps');
            // 4. Verify the selected applications in the Wizard step form:
            let actualApplications = await projectWizard.getSelectedApplications();
            assert.ok(actualApplications.includes(appConst.TEST_APPS_NAME.APP_CONTENT_TYPES),
                'Expected application should be present in the form');
            assert.ok(actualApplications.includes(appConst.TEST_APPS_NAME.APP_WITH_METADATA_MIXIN),
                'Expected application should be present in the form');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/7430
    // Project Applications step is not correctly updated after pressing on Copy from parent button #7430
    it.skip(
        `GIVEN parent project has 2 apps WHEN 'copy apps from parent' has been clicked in layer-wizard THEN 'Copy from default' button gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select the just created project as parent and go to 'Applications' step
            await parentProjectStep.selectParentProject(PROJECT_DISPLAY_NAME);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            // 3. Verify that 'Skip' button is enabled in 'Applications step'
            await applicationsStep.waitForSkipButtonEnabled();
            //await applicationsStep.clickOnCopyFromParentButton(PROJECT_DISPLAY_NAME);
            // let message = await applicationsStep.waitForNotificationMessage();
            // assert.equal(message, appConst.NOTIFICATION_MESSAGES.applicationsCopiedFromParent(PROJECT_DISPLAY_NAME));
            // 4. Verify that 'Copy apps from parent' button is disabled now
            await applicationsStep.waitForCopyFromParentButtonDisabled(PROJECT_DISPLAY_NAME);
            // 5. Verify that 'Next' button is enabled:
            await applicationsStep.waitForNextButtonEnabled();
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/7430
    // Project Applications step is not correctly updated after pressing on Copy from parent button #7430
    it.skip(
        `GIVEN 'copy apps from parent' has been clicked in layer-wizard WHEN both apps have been removed in the dialog THEN 'Copy from default' button gets enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select the just created project and go to 'Applications' step
            await parentProjectStep.selectParentProject(PROJECT_DISPLAY_NAME);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            // 3. Click on 'Copy apps from parent':
            await applicationsStep.clickOnCopyFromParentButton(PROJECT_DISPLAY_NAME);
            await applicationsStep.waitForNotificationMessage();
            // 4. Verify that 2 apps are displayed:
            await applicationsStep.getSelectedApplications();
            let actualApplications = await applicationsStep.getSelectedApplications();
            assert.equal(actualApplications.length, 2, '2 apps should appear in the dialog');
            // 5. Remove both applications:
            await applicationsStep.removeApplication(appConst.TEST_APPS_NAME.APP_CONTENT_TYPES);
            await applicationsStep.removeApplication(appConst.TEST_APPS_NAME.APP_WITH_METADATA_MIXIN);
            // 4. Verify that 'Copy apps from parent' button gets enabled again:
            await applicationsStep.waitForCopyFromParentButtonEnabled(PROJECT_DISPLAY_NAME);
            // 5. Verify that 'Skip' button appears in the dialog:
            await applicationsStep.waitForSkipButtonEnabled();
        });

    it(`GIVEN 'copy apps from parent' has been clicked in layer-wizard WHEN the layer has been created then reopened THEN 2 applications should be displayed in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let nameIdStep = new ProjectWizardDialogNameAndIdStep();
            let summaryStep = new ProjectWizardDialogSummaryStep();
            // 1. Open new project wizard:
            await projectUtils.selectParentAndOpenProjectWizardDialog(PROJECT_DISPLAY_NAME);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            // 2. Click on 'Copy apps from parent':
            //await applicationsStep.clickOnCopyFromParentButton(PROJECT_DISPLAY_NAME);
            //await applicationsStep.waitForNotificationMessage();
            await applicationsStep.clickOnNextButton();
            await nameIdStep.waitForLoaded();
            await nameIdStep.typeDisplayName(LAYER_DISPLAY_NAME);
            await nameIdStep.clickOnNextButton();
            // 3. Click on 'Create' button:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            let layerWizard = new LayerWizardPanel();
            // 4. Open the just created layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 5. Verify that 2 expected applications are displayed in the layer's wizard-form:
            let actualApplications = await layerWizard.getSelectedApplications();
            assert.equal(actualApplications.length, 2, "Two applications should be displayed in the wizard panel");
        });

    it('Post conditions: the layer should be deleted',
        async () => {
            await studioUtils.openSettingsPanel();
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
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
