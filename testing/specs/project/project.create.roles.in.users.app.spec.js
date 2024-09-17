/**
 * Created on 17.04.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const UserBrowsePanel = require("../../page_objects/users/userbrowse.panel");
const RoleWizard = require("../../page_objects/users/role.wizard");
const appConst = require('../../libs/app_const');

describe("project.create.roles.in.users.app.spec - ui-tests for checkin project's roles in Users app", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`GIVEN new project is created WHEN navigate to Users app THEN new 5 new roles should be added in 'Roles' folder`,
        async () => {
            let userBrowsePanel = new UserBrowsePanel();
            // 1. Save new project:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'test description');
            // 2. Go to Users app:
            await studioUtils.showLauncherPanel();
            await studioUtils.navigateToUsersApp();
            // 3. Type the project's name in the filter-input
            await studioUtils.typeNameInUsersFilterPanel(PROJECT_DISPLAY_NAME);
            await studioUtils.saveScreenshot('new_project_roles');
            // 4. Verify that required new roles are added:
            let items = await userBrowsePanel.getGridItemDisplayNames();
            assert.equal(items.length, 5, "Five new roles should be filtered in the grid");
            await userBrowsePanel.waitForRowByDisplayNameVisible(PROJECT_DISPLAY_NAME + " - Owner");
            await userBrowsePanel.waitForRowByDisplayNameVisible(PROJECT_DISPLAY_NAME + " - Editor");
            await userBrowsePanel.waitForRowByDisplayNameVisible(PROJECT_DISPLAY_NAME + " - Contributor");
            await userBrowsePanel.waitForRowByDisplayNameVisible(PROJECT_DISPLAY_NAME + " - Author");
            await userBrowsePanel.waitForRowByDisplayNameVisible(PROJECT_DISPLAY_NAME + " - Viewer");
        });

    it("GIVEN a project's role has been selected THEN 'Delete' button should be disabled",
        async () => {
            let userBrowsePanel = new UserBrowsePanel();
            // 1. Go to Users app
            await studioUtils.navigateToUsersApp();
            // 2. Type the project's name in the filter-input:
            await studioUtils.typeNameInUsersFilterPanel(PROJECT_DISPLAY_NAME);
            // 3. select a project's role:
            await userBrowsePanel.clickOnCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME + " - Owner");
            // 4. Verify that 'Delete' button is disabled:
            await userBrowsePanel.waitForDeleteButtonDisabled();
        });

    it("GIVEN a project's role has been opened THEN 'Delete' button should be disabled in the wizard-toolbar",
        async () => {
            let userBrowsePanel = new UserBrowsePanel();
            let roleWizard = new RoleWizard();
            // 1. Go to Users app
            await studioUtils.navigateToUsersApp();
            // 2. Type the project's name in the filter-input:
            await studioUtils.typeNameInUsersFilterPanel(PROJECT_DISPLAY_NAME);
            // 3. select a project's role:
            await userBrowsePanel.clickOnCheckboxAndSelectRowByDisplayName(PROJECT_DISPLAY_NAME + " - Owner");
            await userBrowsePanel.clickOnEditButton();
            await roleWizard.waitForLoaded();
            // 4. Verify that 'Delete' button is disabled:
            await roleWizard.waitForDeleteButtonDisabled();
        });

    it(`WHEN existing project has been deleted THEN its roles should be deleted`,
        async () => {
            let userBrowsePanel = new UserBrowsePanel();
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.openSettingsPanel();
            // 1. click on the project and delete it:
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
            // 2. Go to Users app:
            await studioUtils.showLauncherPanel();
            await studioUtils.navigateToUsersApp();
            // 3. Type the project's name in the filter-input:
            await studioUtils.typeNameInUsersFilterPanel(PROJECT_DISPLAY_NAME);
            await studioUtils.saveScreenshot('deleted_project_role_filtered');
            // 4. Verify that no roles in the filtered grid:
            let items = await userBrowsePanel.getGridItemDisplayNames();
            assert.equal(items.length, 0, "All project's roles should be deleted");
        });

    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
