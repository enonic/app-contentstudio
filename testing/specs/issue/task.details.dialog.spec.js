/**
 * Created on 21.02.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const IssueDetailsDialogCommentsTab = require('../../page_objects/issue/issue.details.dialog.comments.tab');

describe('task.details.dialog.spec: add a comment and check CommentsTabItem', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let MY_COMMENT = appConstant.generateRandomName('comment');
    let TASK_TITLE = appConstant.generateRandomName('task');
    let newText = "Comment is updated";

    it(`WHEN new task(no items) has been created THEN expected notification should be displayed`,
        async () => {
            let createTaskDialog = new CreateTaskDialog();
            await studioUtils.openCreateTaskDialog();
            await createTaskDialog.typeTitle(TASK_TITLE);
            await createTaskDialog.clickOnCreateTaskButton();
            let message = await createTaskDialog.waitForNotificationMessage();
            assert.equal(message, 'New task created successfully.', 'expected notification message should appear');
        });

    it(`GIVEN issues list dialog is opened WHEN existing task has been clicked THEN Task Details dialog should be loaded`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            let isActive = await taskDetailsDialog.isCommentsTabBarItemActive();
            assert.isTrue(isActive, 'Comments Tab should be active');

            let actualStatus = await taskDetailsDialog.getCurrentStatusInStatusSelector();
            assert.equal(actualStatus, "Open", "'Open' status should be displayed in status selector button");
            //Comment button should be disabled, because it is empty.
            let isCommentButtonDisabled = await commentsTab.isCommentButtonEnabled();
            assert.isFalse(isCommentButtonDisabled, 'Comment button should be disabled');

            let isTextAreaDisplayed = await commentsTab.isCommentTextAreaDisplayed();
            assert.isTrue(isTextAreaDisplayed, 'Text area for comments should be displayed');
        });

    it(`GIVEN Task Details dialog is opened WHEN comment has been typed in the area THEN Comment button gets enabled`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            await commentsTab.typeComment(MY_COMMENT);
            studioUtils.saveScreenshot("issue_comment_typed");
            //'Comment' button gets enabled
            await commentsTab.waitForCommentButtonEnabled();
        });

    it(`GIVEN Task Details dialog is opened WHEN new comment has been typed AND Comment button has been pressed THEN expected notification should be shown`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            //Open Issue Details dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);

            await taskDetailsDialog.waitForDialogOpened();
            //Type text in comment and click on the button:
            await commentsTab.typeComment(MY_COMMENT);
            await commentsTab.clickOnCommentButton();
            let message = await taskDetailsDialog.waitForNotificationMessage();
            studioUtils.saveScreenshot("issue_comment_added");
            assert.equal(message, appConstant.YOUR_COMMENT_ADDED,
                'Expected notification message should be shown when the comment has been added');
            studioUtils.saveScreenshot("issue_comment_button_disabled");
            //'Comment' button gets disabled:
            await commentsTab.waitForCommentButtonDisabled();
        });

    it(`WHEN Task Details dialog is opened THEN just created comment should be present in the comments-list`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            //1. Open Issue List Dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            //2. Open Task Details Dialog:
            await taskDetailsDialog.waitForDialogOpened();
            let result = await commentsTab.isCommentPresent(MY_COMMENT);
            studioUtils.saveScreenshot("issue_comment_added");
            assert.isTrue(result, 'Comment with the name should be present ');
        });

    it(`GIVEN existing task with a comment WHEN Task Details dialog is opened AND the comment has been changed THEN updated comment should appear in the comments-list`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            //1. Open Task Details Dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            await commentsTab.clickOnEditCommentMenuItem(MY_COMMENT);
            await commentsTab.updateComment(MY_COMMENT, newText);
            await commentsTab.clickOnSaveCommentButton(MY_COMMENT);
            let result = await commentsTab.isCommentPresent(newText);
            studioUtils.saveScreenshot("task_comment_updated");
            assert.isTrue(result, 'The comment should be updated');
        });

    it(`GIVEN existing task with a comment WHEN Task Details dialog is opened AND the comment has been deleted THEN the comment should not be present in the comments-list`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let confirmationDialog = new ConfirmationDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            //1. Click on the task and open Task Details Dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Expand menu and click on Delete Comment:
            await commentsTab.clickOnDeleteCommentMenuItem(newText);
            //3. Confirm the deleting:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();

            let result = await commentsTab.isCommentPresent(newText);
            studioUtils.saveScreenshot("task_comment_deleted");
            assert.isFalse(result, 'Comment with the text should be deleted');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
