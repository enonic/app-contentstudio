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
    const LAYER_DISPLAY_NAME_2 = studioUtils.generateRandomName('layer');
    const PARENT_APPS = [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES, appConst.TEST_APPS_NAME.TEST_APP_WITH_METADATA_MIXIN];

    it(`GIVEN project with two selected apps is opened THEN expected application should be present in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1. Save new project with two applications:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'test description', null, null, 'Private', PARENT_APPS);
            // 2. Select the row and click on 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 3. Go to Applications step form in the wizard page:
            await projectWizard.clickOnWizardStep('Applications');
            await studioUtils.saveScreenshot('proj_wizard_2_selected_apps');
            // 4. Verify the selected applications in the Wizard step form:
            let actualApplications = await projectWizard.getSelectedApplications();
            assert.ok(actualApplications.includes(PARENT_APPS[0]), 'Expected application should be present in the form');
            assert.ok(actualApplications.includes(PARENT_APPS[1]), 'Expected application should be present in the form');
        });

    /// If parent project is changed or unselected (user goes from the Applications back to the first step), Applications step should be refreshed accordingly.
    it(`GIVEN select a parent with applications WHEN parent project has been changed THEN 'Applications' step should be refreshed accordingly`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 2. Select the parent - the project with 2 apps
            await parentProjectStep.selectParentProject(PROJECT_DISPLAY_NAME);
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            // 3. Go to application step:
            let apps = await applicationsStep.getSelectedApplications();
            // 4. Verify the apps:
            assert.ok(apps[0] === PARENT_APPS[0], '');
            assert.ok(apps[1] === PARENT_APPS[1], '');
            // 5. Go to 'Parent' step again:
            await applicationsStep.clickOnBackButton();
            await permissionsStep.waitForLoaded();
            await permissionsStep.clickOnBackButton();
            await accessModeStep.waitForLoaded();
            await accessModeStep.clickOnBackButton();
            await languageStep.waitForLoaded();
            await languageStep.clickOnBackButton();
            await parentProjectStep.waitForLoaded();
            // 6. Change the parent project:
            await parentProjectStep.clickOnRemoveSelectedProjectIcon(PROJECT_DISPLAY_NAME);
            await parentProjectStep.selectParentProject('Default');
                // 7. Go to applications step:
            await parentProjectStep.clickOnNextButton();
            await languageStep.clickOnSkipButton();
            await accessModeStep.clickOnNextButton();
            await permissionsStep.clickOnSkipButton();
            // 8. Verify the selected applications and 'remove' icons should be displayed for each app:
            apps = await applicationsStep.getSelectedApplications();
            assert.ok(apps[0] === PARENT_APPS[0], '');
            assert.ok(apps[1] === PARENT_APPS[1], '');
            await applicationsStep.waitForRemoveAppIconDisplayed(apps[0]);
            await applicationsStep.waitForRemoveAppIconDisplayed(apps[1]);
            assert.equal(apps.length, 2, 'Two items should be displayed in the applications step');
        });

    // If parent project is selected on the first step, all of its apps (if any) should be preselected on the "Applications" step
    // Add tests for testing parent project's apps on the Applications step of the Project Wizard #7461
    it(`GIVEN parent project with 2 apps has been selected in the grid WHEN navigated to 'App-step' in layer-wizard THEN both apps should be preselected on the 'Applications' step`,
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
            // 4. 'Remove' icon should not be displayed for both preselected applications:
            await applicationsStep.waitForRemoveAppIconNotDisplayed(PARENT_APPS[0]);
            await applicationsStep.waitForRemoveAppIconNotDisplayed(PARENT_APPS[1]);
            // 5. Verify that 'Copy apps from parent' button should not be displayed:
            await applicationsStep.waitForCopyFromParentButtonNotDisplayed(PROJECT_DISPLAY_NAME);
            // 6. Select one more application:
            await applicationsStep.selectApplication(appConst.TEST_APPS_NAME.SIMPLE_SITE_APP);
            // 7. Verify that 'Remove' icon is displayed for the new selected application:
            await applicationsStep.waitForRemoveAppIconDisplayed(appConst.TEST_APPS_NAME.SIMPLE_SITE_APP);
            let apps = await applicationsStep.getSelectedApplications();
            assert.ok(apps.length === 3, 'Three apps should be displayed in the step');
            await applicationsStep.waitForNextButtonEnabled();
        });

    it(`GIVEN parent project with 2 apps has been selected in the grid WHEN one more app has been added in the App step wizard THEN new layer with 3 apps should be created`,
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
            // 2. Select one more application:
            await applicationsStep.selectApplication(appConst.TEST_APPS_NAME.SIMPLE_SITE_APP);
            // 3. Click on 'Next' button in applications step:
            await applicationsStep.clickOnNextButton();
            await nameIdStep.waitForLoaded();
            await nameIdStep.typeDisplayName(LAYER_DISPLAY_NAME_2);
            await nameIdStep.clickOnNextButton();
            // 3. Click on 'Create' button:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            let layerWizard = new LayerWizardPanel();
            // 4. Open the just created layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME_2);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizard.waitForLoaded();
            // 5. Verify that 2 expected applications are displayed in the layer's wizard-form:
            let actualApplications = await layerWizard.getSelectedApplications();
            assert.equal(actualApplications.length, 3, "Two applications should be displayed in the wizard panel");
        });

    it(`GIVEN parent project with 2 apps has been selected in the grid WHEN the layer has been created then reopened THEN 2 applications should be displayed in the wizard page`,
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
            // 2. Click on 'Skip' button in applications step( only apps from parent project are displayed in the step):
            await applicationsStep.clickOnSkipButton();
            await nameIdStep.waitForLoaded();
            await nameIdStep.typeDisplayName(LAYER_DISPLAY_NAME);
            await nameIdStep.clickOnNextButton();
            // 3. Click on 'Create' button:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            let layerWizardPanel = new LayerWizardPanel();
            // 4. Open the just created layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await layerWizardPanel.waitForLoaded();
            await layerWizardPanel.clickOnWizardStep('Applications');
            // 5. Verify that 2 expected applications are displayed in the layer's wizard-form:
            let actualApplications = await layerWizardPanel.getSelectedApplications();
            assert.equal(actualApplications.length, 2, "Two applications should be displayed in the wizard panel");
            // 6. Verify that Remove-icon is not displayed for both application-items (we can not delete apps that were preselected from a parent project: )
            await layerWizardPanel.waitForRemoveAppIconNotDisplayed(PARENT_APPS[0]);
            await layerWizardPanel.waitForRemoveAppIconNotDisplayed(PARENT_APPS[1]);
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
