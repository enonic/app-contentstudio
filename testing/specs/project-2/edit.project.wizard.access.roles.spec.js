/**
 * Created on 30.04.2020.  updated 0n 25.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const EditProjectDefaultLanguageStep = require("../../page_objects/project/project-wizard-dialog/edit.project.default.language.step");
const appConst = require('../../libs/app_const');
const EditProjectNameStep = require("../../page_objects/project/project-wizard-dialog/edit.project.name.step");
const ProjectWizardDialogAccessModeStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step");
const ProjectWizardDialogPermissionsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step");
const ProjectWizardDialogApplicationsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.applications.step");
const ProjectWizardDialogSummaryStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.summary.step");

describe('edit.project.wizard.access.roles.spec - tests for giving access to manage project and content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const PRINCIPALS = [appConst.systemUsersDisplayName.SUPER_USER];

    it(`Preconditions: new project should be added. SU should be assigned as Contributor`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            // 2. Save new project:
            await projectUtils.saveTestProject({
                name: PROJECT_DISPLAY_NAME,
                accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
                permissions: PRINCIPALS
            });
        });

    it(`WHEN existing project has been clicked AND Edit button pressed THEN default(Contributor) role should be displayed in Roles step wizard`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Click on the project and press 'Edit' button:
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
            // 2. Navigate to Roles step:
            let projectRolesStep = new ProjectWizardDialogPermissionsStep();
            await projectRolesStep.waitForLoaded();
            // 3. Verify that expected role is displayed in Roles step: SU should be with Contributor role by default
            let actualRole = await projectRolesStep.getRoleInSelectedPrincipal("Super User");
            assert.equal(actualRole, appConst.PROJECT_ROLES.CONTRIBUTOR, "Contributor role should be set by default");

            await projectRolesStep.expandPrincipalRoleMenu("Super User");
            let actualItems = await projectRolesStep.getRolesInExpandedRoleMenu();
            assert.equal(actualItems[0], appConst.PROJECT_ROLES.OWNER, "'Owner' role should be in the options");
            assert.equal(actualItems[1], appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the options");
            assert.equal(actualItems[2], appConst.PROJECT_ROLES.CONTRIBUTOR, "'Contributor' role should be in the options");
            assert.equal(actualItems[3], appConst.PROJECT_ROLES.AUTHOR, "'Author' role should be in the options");
            assert.equal(actualItems.length, 4, "4 options (roles) should be in the options");
        });

    it(`GIVEN existing project has been clicked AND Edit button pressed WHEN Editor role has been set AND 'Update project' pressed THEN wizard should be closed` ,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Click on the project and press 'Edit' button:
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
            // 2. Navigate to Roles step:
            let projectRolesStep = new ProjectWizardDialogPermissionsStep();
            await projectRolesStep.waitForLoaded();
            await projectRolesStep.expandPrincipalRoleMenu('Super User');
            // 3. Select Editor role for Super User
            await projectRolesStep.clickOnRoleInExpandedMenu(appConst.PROJECT_ROLES.EDITOR);
            // 4. Verify the selected option
            let actualRole = await projectRolesStep.getRoleInSelectedPrincipal('Super User');
            assert.equal(actualRole, appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the selected options");
            await projectRolesStep.clickOnNextButton();
            let applicationStep = new ProjectWizardDialogApplicationsStep();

            if (await applicationStep.isLoaded()) {
                await applicationStep.clickOnNextButton();
            }
            // 5. Update the project
            let projectWizardDialogSummaryStep = new ProjectWizardDialogSummaryStep();
            await projectWizardDialogSummaryStep.waitForLoaded();
            await projectWizardDialogSummaryStep.clickOnUpdateProjectButton();
            await projectWizardDialogSummaryStep.waitForDialogClosed();
        });

    it(`WHEN existing project(SU is Editor) is opened THEN expected 'Editor' role should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Click on the project and press 'Edit' button:
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
            // 2. Navigate to Roles step:
            let projectRolesStep = new ProjectWizardDialogPermissionsStep();
            await projectRolesStep.waitForLoaded();
            // 3. Verify that expected role(Editor) is displayed in Roles step: SU should be Editor in that project
            let actualRole = await projectRolesStep.getRoleInSelectedPrincipal("Super User");
            assert.equal(actualRole, appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the selected options");
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
