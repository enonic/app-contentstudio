/**
 * Created on 25.05.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');

describe('close.task.without.items.spec: create task without items, close the task and reopen it again', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('task');

    it(`WHEN new task without items has been created THEN 'No items to publish' should be displayed in the Items-tab`,
        async () => {
            let createTaskDialog = new CreateTaskDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1. Open Create Task dialog:
            await studioUtils.openCreateTaskDialog();
            await createTaskDialog.typeTitle(issueTitle);
            //2. Click on Create Issue:
            await createTaskDialog.clickOnCreateTaskButton();
            await taskDetailsDialog.waitForDialogOpened();
            //Click on Items-tab:
            await taskDetailsDialog.clickOnItemsTabBarItem();
            let result = await taskDetailsDialog.isNoActionLabelPresent();
            assert.isTrue(result, `No items to publish' should be displayed, because items were not selected`);
        });

    it(`GIVEN existing 'open' task is clicked and Task Details dialog is opened WHEN 'Close Task' button has been pressed THEN the task gets 'Closed'`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            await studioUtils.openIssuesListDialog();
            //1. Click on the task and open Task Details dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Click on 'Close Issue' button:
            await taskDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            studioUtils.saveScreenshot("empty_issue_closed");
            //'The issue is Closed.' - this message should appear
            await taskDetailsDialog.waitForExpectedNotificationMessage(appConstant.TASK_CLOSED_MESSAGE);
        });

    it(`GIVEN 'closed' task is clicked and Task Details dialog is opened WHEN 'Reopen Issue' button has been pressed THEN the tsk gets 'Open'`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();

            await studioUtils.openIssuesListDialog();
            //1. Click on 'Closed' button and load 'closed' issues:
            await issueListDialog.clickOnClosedButton();
            await issueListDialog.clickOnIssue(issueTitle);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Reopen the task:
            await taskDetailsDialog.clickOnReopenTaskButton();
            studioUtils.saveScreenshot("empty_task_reopened");
            //3. 'The issue is Open - this message should appear:
            await taskDetailsDialog.waitForExpectedNotificationMessage(appConstant.TASK_OPENED_MESSAGE);
            let actualStatus = await taskDetailsDialog.getCurrentStatusInStatusSelector();
            assert.equal(actualStatus, "Open", "'Open' status should be displayed in status selector button");
        });

    it(`GIVEN Task Details dialog is opened WHEN 'Esc' key has been pressed THEN modal dialog should be closed`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            //2. Open Task Details Dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await taskDetailsDialog.waitForDialogOpened();
            //3. Click on Esc:
            await taskDetailsDialog.pressEscKey();
            studioUtils.saveScreenshot("issue_details_esc_key");
            //issue details dialog should be closed:
            await taskDetailsDialog.waitForDialogClosed();
            //issues list dialog should be closed:
            await issueListDialog.waitForDialogClosed();
        });

    it(`GIVEN Task Details dialog is opened WHEN 'back-button' key has been pressed THEN Issues list dialog gets visible`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1. Open Issues List
            await studioUtils.openIssuesListDialog();
            //2. Open Task Details Dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await taskDetailsDialog.waitForDialogOpened();
            //3. Click on Back button:
            await taskDetailsDialog.clickOnBackButton();
            studioUtils.saveScreenshot("issue_details_back_clicked");
            //issues list dialog should be loaded:
            await issueListDialog.waitForDialogOpened();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
