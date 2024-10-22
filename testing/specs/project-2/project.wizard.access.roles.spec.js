/**
 * Created on 30.04.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('project.wizard.access.roles.spec - tests for giving access to manage project and content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const TEST_DESCRIPTION = "test description";
    const PRINCIPALS = [appConst.systemUsersDisplayName.SUPER_USER];

    it(`Preconditions: new project should be added. SU should be assigned as Contributor`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            //2. Save new project:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, null, PRINCIPALS);
        });

    it(`WHEN existing project(with project access entry) is opened THEN default(Contributor) role should be displayed in the selected option`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Verify that expected role is displayed in Roles step: SU should be with Contributor role by default
            let actualRole = await projectWizard.getSelectedRoleInProjectAccessControlEntry("su");
            assert.equal(actualRole, appConst.PROJECT_ROLES.CONTRIBUTOR, "Contributor role should be set by default");
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/7978
    // Refactor AccessSelector #7978
    it(`GIVEN existing project(with project access entry) is opened WHEN Project Access Menu has been expanded THEN expected roles should be present in the menu`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.clickOnWizardStep('Roles');
            let result = await projectWizard.getAvailableProjectAccessRoles('su');
            // 2. Verify that 3 expected options (roles) are displayed in the menu:
            assert.equal(result[0], appConst.PROJECT_ROLES.OWNER, "'Owner' role should be in the options");
            assert.equal(result[1], appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the options");
            assert.equal(result[2], appConst.PROJECT_ROLES.AUTHOR, "'Author' role should be in the options");
            assert.equal(result.length, 3, "3 options (roles) should be in the options");
        });

    it(`GIVEN existing project(with project access entry) is opened WHEN default role has been changed THEN 'Save' button gets enabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.expandProjectAccessMenuAndSelectRole("su", appConst.PROJECT_ROLES.EDITOR);
            //2. Verify that expected role is displayed in Roles step: SU should be Contributor by default
            let actualRole = await projectWizard.getSelectedRoleInProjectAccessControlEntry("su",);
            assert.equal(actualRole, appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the selected options");
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
            assert.equal(actualRole, appConst.PROJECT_ROLES.EDITOR, "'Editor' role should be in the selected options");
            //3. Verify that 'Save' button is disabled:
            await projectWizard.waitForSaveButtonDisabled();
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
