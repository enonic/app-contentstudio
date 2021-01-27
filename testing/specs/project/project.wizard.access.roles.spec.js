/**
 * Created on 30.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');

describe('project.wizard.access.roles.spec - tests for giving access to manage project and content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let TEST_DESCRIPTION = "test description";
    let PRINCIPALS = [appConstant.systemUsersDisplayName.SUPER_USER];

    it(`Preconditions: new project should be added. SU should be assigned as Contributor`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //2. Save new project:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, null, PRINCIPALS);
        });

    it(`WHEN existing project(with project access entry) is opened THEN default(Contributor) role should be displayed in the selected option`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that expected role is displayed in Roles step: SU should be with Contributor role by default
            let actualRole = await projectWizard.getSelectedRoleInProjectAccessControlEntry("su");
            assert.equal(actualRole, appConstant.PROJECT_ROLES.CONTRIBUTOR, "Contributor role should be set by default");
        });

    it(`GIVEN existing project(with project access entry) is opened WHEN Project Access Menu has been expanded THEN expected roles should be present in the menu`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            let result = await projectWizard.getAvailableProjectAccessRoles("su");
            //2. Verify that expected roles are displayed in the menu:
            assert.equal(result[0], appConstant.PROJECT_ROLES.CONTRIBUTOR, "'Contributor' role should be in the options");
            assert.equal(result[1], appConstant.PROJECT_ROLES.AUTHOR, "'Author' role should be in the options");
            assert.equal(result[2], appConstant.PROJECT_ROLES.EDITOR, "'Editor' role should be in the options");
            assert.equal(result[3], appConstant.PROJECT_ROLES.OWNER, "'Owner' role should be in the options");
            assert.equal(result.length, 4, "4 roles should be in the options");
        });

    it(`GIVEN existing project(with project access entry) is opened WHEN default role has been changed THEN 'Save' button gets enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.expandProjectAccessMenuAndSelectRole("su", appConstant.PROJECT_ROLES.EDITOR);
            //2. Verify that expected role is displayed in Roles step: SU should be Contributor by default
            let actualRole = await projectWizard.getSelectedRoleInProjectAccessControlEntry("su",);
            assert.equal(actualRole, appConstant.PROJECT_ROLES.EDITOR, "'Editor' role should be in the selected options");
            //3. Verify that Save button gets enabled:
            await projectWizard.waitForSaveButtonEnabled();
            await projectWizard.waitAndClickOnSave();
        });

    it(`WHEN existing project(SU is Editor) is opened THEN expected project ACE should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();

            //2. Verify that expected role is displayed in Roles step: SU should be Editor in that project
            let actualRole = await projectWizard.getSelectedRoleInProjectAccessControlEntry("su",);
            assert.equal(actualRole, appConstant.PROJECT_ROLES.EDITOR, "'Editor' role should be in the selected options");
            //3. Verify that 'Save' button is disabled:
            await projectWizard.waitForSaveButtonDisabled();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioWithProjects();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
