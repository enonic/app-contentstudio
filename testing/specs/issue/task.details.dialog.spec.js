/**
 * Created on 21.02.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
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

            let isCloseButtonDisplayed = await taskDetailsDialog.isCloseTaskButtonDisplayed();
            assert.isTrue(isCloseButtonDisplayed, 'Close Task button should be present');
            //Comment button should be disabled, because it is empty.
            let isCommentButtonDisabled = await commentsTab.isCommentButtonEnabled();
            assert.isFalse(isCommentButtonDisabled, 'Comment button should be disabled');

            let isTextAreaDisplayed = await commentsTab.isCommentTextAreaDisplayed();
            assert.isTrue(isTextAreaDisplayed, 'Text area for comments should be displayed');
        });

    it(`GIVEN Task Details dialog is opened WHEN comment has been typed in the area THEN Comment button is getting enabled`,
        () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(TASK_TITLE);
            }).then(() => {
                return taskDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.typeComment(MY_COMMENT);
            }).then(() => {
                studioUtils.saveScreenshot("issue_comment_typed");
                return assert.eventually.isTrue(commentsTab.waitForCommentButtonEnabled(), 'Comment button is getting enabled');
            });
        });

    it(`GIVEN Task Details dialog is opened WHEN new comment has been typed AND Comment button has been pressed THEN expected notification should be shown`,
        () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(TASK_TITLE);
            }).then(() => {
                return taskDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.typeComment(MY_COMMENT);
            }).then(() => {
                return commentsTab.clickOnCommentButton();
            }).then(() => {
                return taskDetailsDialog.waitForNotificationMessage();
            }).then(message => {
                studioUtils.saveScreenshot("issue_comment_added");
                assert.equal(message, appConstant.YOUR_COMMENT_ADDED,
                    'Expected notification message should be shown when the comment has been added');
            }).then(() => {
                studioUtils.saveScreenshot("issue_comment_button_disabled");
                return assert.eventually.isTrue(commentsTab.waitForCommentButtonDisabled(), 'Comment button is getting disabled');
            });
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

    it(`GIVEN existing task with a comment WHEN Task Details dialog is opened AND the comment has been changed THEN updated comment should be present in the comments-list`,
        () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(TASK_TITLE);
            }).then(() => {
                return taskDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.clickOnEditCommentMenuItem(MY_COMMENT);
            }).then(() => {
                return commentsTab.updateComment(MY_COMMENT, newText);
            }).then(() => {
                return commentsTab.clickOnSaveCommentButton(MY_COMMENT);
            }).then(() => {
                return commentsTab.isCommentPresent(newText);
            }).then(result => {
                studioUtils.saveScreenshot("task_comment_updated");
                assert.isTrue(result, 'Comment with the new text should be present ');
            })
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
