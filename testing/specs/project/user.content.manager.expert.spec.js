/**
 * Created on 17.05.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const appConst = require('../../libs/app_const');

describe('user.content.manager.expert.spec - ui-tests for content manager expert role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const WARNING_MESSAGE = "Your permissions don't allow access to any projects. Please contact your administrator.";
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;

    it(`Precondition 1: new system user should be added, the user doesn't have any available projects`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName("cm-expert");
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP_EXPERT];
            USER = contentBuilder.buildUser(userName, PASSWORD, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    // Verifies - https://github.com/enonic/app-contentstudio/issues/3112
    // No message is shown in the Select project dialog when user doesn't have any available projects #3112
    it("WHEN user with 'Content Manage Expert' is logged in THEN 'Project Selection' dialog should should be loaded with the expected warning message",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            //1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //2. Verify that Project Selection dialog is loaded with expected warning message
            await projectSelectionDialog.getWarningMessage();
            let message = await projectSelectionDialog.getWarningMessage();
            assert.equal(message, WARNING_MESSAGE, "Expected warning should be in the modal dialog");
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        if (title.includes(appConst.CONTENT_STUDIO_TITLE) || title.includes("Users")) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
