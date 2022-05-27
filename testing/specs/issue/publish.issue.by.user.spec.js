/**
 * Created on 16.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const TaskDetailsDialogItemsTab = require('../../page_objects/issue/task.details.items.tab');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.task.by.user.spec: create a task for user and this user publish it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const TASK_TITLE = appConst.generateRandomName("task");

    it(`Precondition 1: new system user should be added`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new system user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName("user");
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP, appConst.SYSTEM_ROLES.CM_ADMIN];
            USER = contentBuilder.buildUser(userName, PASSWORD, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`GIVEN SU selects a folder and opens 'Create Task...' dialog WHEN new task has been assigned to the just created user THEN new task should be loaded in IssueDetailsDialog`,
        async () => {
            await studioUtils.navigateToContentStudioApp()
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //2. Select the folder and open Create Task dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(TASK_TITLE);
            //3. Assign the task to the just created user:
            await createTaskDialog.selectUserInAssignees(USER.displayName);
            await studioUtils.saveScreenshot("task_assigned_2");
            //4. Click on 'Create Task' button and create new task:
            await createTaskDialog.clickOnCreateTaskButton();
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, appConst.TASK_CREATED_MESSAGE);
            await taskDetailsDialog.waitForDialogOpened();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN the user is logged in WHEN the user closed his task THEN the issue should be 'Closed' in the issue details dialog",
        async () => {
            //1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            //2. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            //3. Click on the task and load Task Details Dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //4. Expand the status selector
            await taskDetailsDialog.clickOnItemsTabBarItem();
            await taskDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            //4. Click on 'Publish Now' button in Publish Wizard dialog:
            await contentPublishDialog.clickOnPublishNowButton();
            await studioUtils.saveScreenshot("task_published_by_user");
            //6. Verify that the notification message appears:
            await taskDetailsDialog.waitForNotificationMessage();
            await taskDetailsDialog.waitForReopenButtonLoaded();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it(`GIVEN SU is logged in WHEN the task, just published by the user has been loaded in task details dialog THEN 'closed by' info should be present`,
        async () => {
            //1. SU is logged in:
            await studioUtils.navigateToContentStudioApp()
            let taskDetailsDialog = new TaskDetailsDialog();
            let issueListDialog = new IssueListDialog();
            //2. SU opens 'Issues List' dialog:
            await studioUtils.openIssuesListDialog();
            //3. Open 'Closed' issues tab:
            await issueListDialog.clickOnClosedButton();
            //4. Click on the task:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            //5. Verify the status info:
            let info = await taskDetailsDialog.getStatusInfo();
            let expectedMessage = appConst.issueClosedBy(USER.displayName);
            //6. Verify that the info message is displayed in the status selector : "Closed by user:system:${userName}"
            assert.isTrue(info.includes(expectedMessage), "Expected notification message should appear");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
