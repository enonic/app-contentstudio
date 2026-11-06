/**
 * Created on 07.02.2023  updated on 06.11.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');
const EditProjectDefaultLanguageStep = require('../../page_objects/project/project-wizard-dialog/edit.project.default.language.step');
const EditProjectNameStep = require('../../page_objects/project/project-wizard-dialog/edit.project.name.step');

describe('project.wizard.two.apps.spec - Select 2 applications in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    // Layer that is actually saved (child of the project with two apps), its apps are inherited from the parent:
    const LAYER_WITH_INHERITED_APPS = studioUtils.generateRandomName('layer');
    const PARENT_APPS = [
        appConst.TEST_APPS_NAME.APP_CONTENT_TYPES,
        appConst.TEST_APPS_NAME.TEST_APP_WITH_METADATA_MIXIN,
    ];

    it(`GIVEN project with two selected apps is opened THEN expected application should be present in the wizard page`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        // 1. Save new project with two applications:
        await projectUtils.saveTestProject({
            name: PROJECT_DISPLAY_NAME,
            language: appConst.LANGUAGES.EN,
            accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
            applications: PARENT_APPS,
        });
        // 2. Select the project and click on 'Edit' button:
        await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
        await settingsBrowsePanel.clickOnEditButton();
        let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
        await editProjectDefaultLanguageStep.waitForLoaded();
        await editProjectDefaultLanguageStep.clickOnNextButton();
        let editProjectNameStep = new EditProjectNameStep();
        await editProjectNameStep.waitForLoaded();
        await editProjectNameStep.clickOnNextButton();
        let projectWizardDialogAccessModeStep = new ProjectWizardDialogAccessModeStep();
        await projectWizardDialogAccessModeStep.waitForLoaded();
        await projectWizardDialogAccessModeStep.clickOnNextButton();
        let projectRolesStep = new ProjectWizardDialogPermissionsStep();
        await projectRolesStep.waitForLoaded();
        await projectRolesStep.clickOnNextButton();
        let applicationStep = new ProjectWizardDialogApplicationsStep();
        await applicationStep.waitForLoaded();
        // 3. Verify the selected applications in the Applications step wizard form:
        let actualApplications = await applicationStep.getSelectedApplications();
        await studioUtils.saveScreenshot('edit_proj_wizard_2_selected_apps');
        assert.ok(actualApplications.includes(PARENT_APPS[0]), 'Expected application should be present in the form');
        assert.ok(actualApplications.includes(PARENT_APPS[1]), 'Expected application should be present in the form');
    });

    // Impossible to configure apps added to a project #11630
    // https://github.com/enonic/app-contentstudio/issues/11630
    it(`GIVEN existing project is opened in the wizard WHEN 'Edit' icon has been clicked in the Applications step THEN application config dialog should be loaded`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        // 1. Select the project and click on 'Edit' button:
        await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
        await settingsBrowsePanel.clickOnEditButton();
        // 2. Go to the Applications step:
        await goToApplicationsStepInEditWizard();
        // 3. 'Edit' icon should be enabled for the app with a config form (the project already exists):
        await applicationsStep.waitForEditAppIconEnabled(PARENT_APPS[0]);
        // 4. The note about disabled configs should not be displayed in the edit mode:
        await applicationsStep.waitForConfigsDisabledNoteNotDisplayed();
        // 5. Click on the 'Edit' icon:
        let configDialog = await applicationsStep.clickOnEditAppIcon(PARENT_APPS[0]);
        await studioUtils.saveScreenshot('edit_proj_wizard_app_config_dialog');
        // 6. Verify that the application config dialog is loaded with the expected app name in the header:
        let title = await configDialog.getTitle();
        assert.equal(title, PARENT_APPS[0], 'Application display name should be displayed in the config dialog');
        // 7. Close the config dialog:
        await configDialog.clickOnCloseButton();
        // 8. Applications step should be displayed again:
        await applicationsStep.waitForLoaded();
    });

    /// If parent project is changed or unselected (user goes from the Applications back to the first step), Applications step should be refreshed accordingly.
    // tests for testing parent project's apps on the Applications step of the Project Wizard #7461
    // Layer wizard - Applications from a removed project are still displayed in the Applications Step #10656
    // https://github.com/enonic/app-contentstudio/issues/10656
    it(`GIVEN select a parent with applications WHEN parent project has been changed THEN 'Applications' step should be refreshed accordingly`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        let projectRolesStep = new ProjectWizardDialogPermissionsStep();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();

        // 1. Open new project wizard:
        await settingsBrowsePanel.openProjectWizardDialog();
        // 2. Select the parent - the parent project with 2 apps
        await parentProjectStep.selectParentProject(PROJECT_DISPLAY_NAME);
        await parentProjectStep.clickOnNextButton();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.typeDisplayName(LAYER_DISPLAY_NAME);
        await nameAndIdStep.clickOnNextButton();
        await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
        await accessModeStep.clickOnNextButton();
        await projectRolesStep.waitForLoaded();
        await projectRolesStep.clickOnNextButton();
        // 3. Go to application step:
        let apps = await applicationsStep.getSelectedApplications();
        // 4. Verify the apps:
        assert.ok(apps[0] === PARENT_APPS[0], 'Expected application  should be displayed in the app-step');
        assert.ok(apps[1] === PARENT_APPS[1], 'Expected application  should be displayed in the app-step');
        // 5. Go to 'Parent' step again:
        await applicationsStep.clickOnPreviousButton();
        await projectRolesStep.waitForLoaded();
        await projectRolesStep.clickOnPreviousButton();
        await accessModeStep.waitForLoaded();
        await accessModeStep.clickOnPreviousButton();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.clickOnPreviousButton();
        await parentProjectStep.waitForLoaded();
        // 6. Change the parent project:
        await parentProjectStep.clickOnRemoveSelectedProjectIcon(PROJECT_DISPLAY_NAME);
        await parentProjectStep.selectParentProject('Default');
        // 7. Go to applications step:
        await parentProjectStep.clickOnNextButton();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.clickOnNextButton();
        await accessModeStep.clickOnNextButton();
        await projectRolesStep.waitForLoaded();
        await projectRolesStep.clickOnNextButton();
        // 8. Verify the selected applications and 'remove' icons should be displayed for each app:
        apps = await applicationsStep.getSelectedApplications();
        assert.ok(apps.length === 0, 'Application should not be displayed in the app-step');
    });

    it(`GIVEN layer wizard is opened AND Navigated to App step WHEN one mor app has been added THEN the app should be displayed with Remove icon`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        let projectRolesStep = new ProjectWizardDialogPermissionsStep();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        // 1. Select the parent project in grid:
        await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
        // 2. Open wizard for new layer:
        await settingsBrowsePanel.openProjectWizardDialog();
        // 3. The parent project should be selected by default:
        await parentProjectStep.clickOnNextButton();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.typeDisplayName(LAYER_DISPLAY_NAME);
        await nameAndIdStep.clickOnNextButton();
        await accessModeStep.clickOnAccessModeRadio(appConst.PROJECT_ACCESS_MODE.PUBLIC);
        await accessModeStep.clickOnNextButton();
        await projectRolesStep.waitForLoaded();
        await projectRolesStep.clickOnNextButton();
        // 4. Go to application step:
        await applicationsStep.waitForLoaded();
        let apps = await applicationsStep.getSelectedApplications();
        // 5. Verify the apps:
        assert.ok(apps[0] === PARENT_APPS[0], 'Expected application  should be displayed in the app-step');
        assert.ok(apps[1] === PARENT_APPS[1], 'Expected application  should be displayed in the app-step');
        // 6. Select one more application:
        await applicationsStep.selectApplication(appConst.TEST_APPS_NAME.MY_FIRST_APP);
        // 7. Verify that 'Remove' icon is displayed for the new selected application:
        await applicationsStep.waitForRemoveAppIconDisplayed(appConst.TEST_APPS_NAME.MY_FIRST_APP);
    });

    // Config should be available for inherited apps as well (layers) #11630
    // https://github.com/enonic/app-contentstudio/issues/11630
    it(`GIVEN existing layer with inherited apps is opened in the wizard WHEN 'Edit' icon of the inherited app has been clicked THEN application config dialog should be loaded`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        // 1. Create a layer in the project with two apps. The layer has no own apps, both apps are inherited:
        await projectUtils.clickOnNewAndOpenProjectWizardDialog();
        let layer = projectUtils.buildLayer(
            PROJECT_DISPLAY_NAME,
            null,
            appConst.PROJECT_ACCESS_MODE.PRIVATE,
            null,
            null,
            LAYER_WITH_INHERITED_APPS,
            null,
            null,
        );
        await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
        // await settingsBrowsePanel.waitForNotificationMessage();
        // 2. Select the layer and click on 'Edit' button:
        await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_WITH_INHERITED_APPS);
        await settingsBrowsePanel.clickOnEditButton();
        // 3. Go to the Applications step:
        await goToApplicationsStepInEditWizard();
        // 4. Both inherited apps should be listed:
        let apps = await applicationsStep.getSelectedApplications();
        assert.ok(apps.includes(PARENT_APPS[0]), 'Inherited application should be displayed in the app-step');
        assert.ok(apps.includes(PARENT_APPS[1]), 'Inherited application should be displayed in the app-step');
        // 5. 'Edit' icon should be enabled for the inherited app, 'Remove' icon should not be displayed:
        await applicationsStep.waitForEditAppIconEnabled(PARENT_APPS[0]);
        await applicationsStep.waitForRemoveAppIconNotDisplayed(PARENT_APPS[0]);
        // 6. Click on the 'Edit' icon of the inherited app:
        let configDialog = await applicationsStep.clickOnEditAppIcon(PARENT_APPS[0]);
        await studioUtils.saveScreenshot('edit_layer_wizard_inherited_app_config_dialog');
        // 7. Verify that the application config dialog is loaded with the expected app name in the header:
        let title = await configDialog.getTitle();
        assert.equal(title, PARENT_APPS[0], 'Application display name should be displayed in the config dialog');
        // 8. Close the config dialog, the Applications step should be displayed again:
        await configDialog.clickOnCloseButton();
        await applicationsStep.waitForLoaded();
    });

    it('Post conditions: the layer should be deleted', async () => {
        await projectUtils.selectAndDeleteProject(LAYER_WITH_INHERITED_APPS);
    });

    // Edit wizard: goes from the first (default language) step to the Applications step
    async function goToApplicationsStepInEditWizard() {
        let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
        await editProjectDefaultLanguageStep.waitForLoaded();
        await editProjectDefaultLanguageStep.clickOnNextButton();
        let editProjectNameStep = new EditProjectNameStep();
        await editProjectNameStep.waitForLoaded();
        await editProjectNameStep.clickOnNextButton();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        await accessModeStep.waitForLoaded();
        await accessModeStep.clickOnNextButton();
        let projectRolesStep = new ProjectWizardDialogPermissionsStep();
        await projectRolesStep.waitForLoaded();
        await projectRolesStep.clickOnNextButton();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        return await applicationsStep.waitForLoaded();
    }

    beforeEach(async () => {
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
