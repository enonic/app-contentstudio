/**
 * Created on 30.04.2020.  updated on 27.11.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const projectUtils = require('../../libs/project.utils');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const EditProjectDefaultLanguageStep = require('../../page_objects/project/project-wizard-dialog/edit.project.default.language.step');
const appConst = require('../../libs/app_const');
const EditProjectNameStep = require('../../page_objects/project/project-wizard-dialog/edit.project.name.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogSummaryStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.summary.step');

describe('edit.project.wizard.access.roles.spec - tests for giving access to manage project and content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const USER_NAME = builder.generateRandomName('user');
    const PRINCIPALS = [USER_NAME];

    it(`Precondition: new system user should be created`, async () => {
        // 'su' and 'anonymous' can not be members of project roles (enonic/xp#12443), so a regular user is used:
        let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
        let user = builder.buildUser(USER_NAME, appConst.PASSWORD.MEDIUM, builder.generateEmail(USER_NAME), roles);
        await studioUtils.createSystemUserViaApi(user);
    });

    it(`Precondition: new project should be added AND the user should be assigned as Contributor`, async () => {
        // 1. Navigate to Settings Panel:
        await studioUtils.closeProjectSelectionDialog();
        // 2. Save new project:
        await projectUtils.saveTestProject({
            name: PROJECT_DISPLAY_NAME,
            accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
            permissions: PRINCIPALS,
        });
    });

    it(`WHEN existing project has been opened in the edit wizard THEN the default 'Contributor' role should be displayed for the user in Roles step`, async () => {
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
        // 3. Verify that expected role is displayed in Roles step: the user should be with Contributor role by default
        let actualRole = await projectRolesStep.getRoleInSelectedPrincipal(USER_NAME);
        assert.equal(actualRole, appConst.PROJECT_ROLES.CONTRIBUTOR, 'Contributor role should be set by default');

        await projectRolesStep.expandPrincipalRoleMenu(USER_NAME);
        let actualItems = await projectRolesStep.getRolesInExpandedRoleMenu();
        assert.equal(actualItems[0], appConst.PROJECT_ROLES.OWNER, "'Owner' role should be in the options");
        assert.equal(actualItems[1], appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the options");
        assert.equal(actualItems[2], appConst.PROJECT_ROLES.CONTRIBUTOR, "'Contributor' role should be in the options");
        assert.equal(actualItems[3], appConst.PROJECT_ROLES.AUTHOR, "'Author' role should be in the options");
        assert.equal(actualItems.length, 4, '4 options (roles) should be in the options');
    });

    it(`GIVEN Roles step is opened in the edit wizard WHEN 'Editor' role has been selected for the user AND 'Update Project' button has been pressed THEN the wizard should be closed`, async () => {
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
        await projectRolesStep.expandPrincipalRoleMenu(USER_NAME);
        // 3. Select Editor role for the user
        await projectRolesStep.clickOnRoleInExpandedMenu(appConst.PROJECT_ROLES.EDITOR);
        // 4. Verify the selected option
        let actualRole = await projectRolesStep.getRoleInSelectedPrincipal(USER_NAME);
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

    it(`WHEN the updated project has been reopened THEN 'Editor' role should be displayed for the user in Roles step`, async () => {
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
        // 3. Verify that expected role(Editor) is displayed in Roles step: the user should be Editor in that project
        let actualRole = await projectRolesStep.getRoleInSelectedPrincipal(USER_NAME);
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
