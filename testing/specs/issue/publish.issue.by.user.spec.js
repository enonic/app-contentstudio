/**
 * Created on 16.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');

describe('publish.issue.by.user.spec: an user publishes assigned to him issue', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const ISSUE_TITLE = appConst.generateRandomName('issue');

    it(`Precondition 1: new system user should be added`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new system user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName('user');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP, appConst.SYSTEM_ROLES.CM_ADMIN];
            USER = contentBuilder.buildUser(userName, PASSWORD, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`GIVEN SU selects a folder and opens 'Create Issue...' dialog WHEN new issue has been assigned to the just created user THEN new issue should be loaded in IssueDetailsDialog`,
        async () => {
            await studioUtils.navigateToContentStudioApp()
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Select the folder and open Create Task dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            // 3. Assign the issue to the just created user:
            await createIssueDialog.selectUserInAssignees(USER.displayName);
            await studioUtils.saveScreenshot('issue_assigned_2');
            // 4. Click on 'Create Task' button and create new task:
            await createIssueDialog.clickOnCreateIssueButton();
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.ISSUE_CREATED_MESSAGE);
            await issueDetailsDialog.waitForDialogLoaded();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN the user is logged in WHEN the user closed his task THEN the issue should be 'Closed' in the issue details dialog",
        async () => {
            // 1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 2. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            // 3. Click on the task and load Task Details Dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 4. Expand the status selector
            await issueDetailsDialog.clickOnItemsTabBarItem();
            await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 4. Click on 'Publish Now' button in Publish Wizard dialog:
            await contentPublishDialog.clickOnPublishNowButton();
            await studioUtils.saveScreenshot('task_published_by_user');
            // 6. Verify that the notification message appears:
            await issueDetailsDialog.waitForNotificationMessage();
            await issueDetailsDialogItemsTab.getSt
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it(`GIVEN SU is logged in WHEN the task, just published by the user has been loaded in task details dialog THEN 'closed by' info should be present`,
        async () => {
            // 1. SU is logged in:
            await studioUtils.navigateToContentStudioApp()
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            // 2. SU opens 'Issues List' dialog:
            await studioUtils.openIssuesListDialog();
            // 3. Open 'Closed' issues tab:
            await issueListDialog.clickOnClosedTabButton();
            // 4. Click on the task:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            // 5. Verify the status info:
            // TODO epic-enonic-ui - is not implemented yet:
            //let info = await issueDetailsDialog.getIssueStatusInfo();
            //let expectedMessage = appConst.issueClosedBy(USER.displayName);
            // 6. Verify that the info message is displayed in the status selector : "Closed by user:system:${userName}"
            //assert.ok(info.includes(expectedMessage), "Expected notification message should appear");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
