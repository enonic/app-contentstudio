/**
 * Created on 21.02.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const IssueDetailsDialogCommentsTab = require('../../page_objects/issue/issue.details.dialog.comments.tab');
const appConst = require('../../libs/app_const');

describe('issue.details.dialog.spec: add a comment and check CommentsTabItem', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let MY_COMMENT = appConst.generateRandomName('comment');
    let ISSUE_TITLE = appConst.generateRandomName('issue');
    let newText = 'Comment is updated';

    it(`WHEN new task(no items) has been created THEN expected notification should be displayed`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnCreateIssueButton();
            let message = await createIssueDialog.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.ISSUE_CREATED_MESSAGE,
                'The issue has been created. - notification message should appear');
        });

    it(`GIVEN issues list dialog is opened WHEN existing task has been clicked THEN 'Task Details dialog' should be loaded`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 1. Verify that Comments tab is active by default
            let isActive = await issueDetailsDialog.isCommentsTabBarItemActive();
            assert.ok(isActive, 'Comments Tab should be active');
            // 2. Verify that status of the task is 'Open'
            let actualStatus = await issueDetailsDialog.getCurrentStatusInStatusSelector();
            assert.equal(actualStatus, 'Open', "'Open' status should be displayed in status selector button");
            // 3. Comment button should be disabled, because the textarea is empty.
            let isCommentButtonDisabled = await commentsTab.isCommentButtonEnabled();
            assert.ok(isCommentButtonDisabled === false, 'Comment button should be disabled');
            let isTextAreaDisplayed = await commentsTab.isCommentTextAreaDisplayed();
            assert.ok(isTextAreaDisplayed, 'Text area for comments should be displayed');
        });

    it(`GIVEN Task Details dialog is opened WHEN comment has been typed in the area THEN Comment button gets enabled`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 1. Fill in the comment textarea
            await commentsTab.typeComment(MY_COMMENT);
            await studioUtils.saveScreenshot('issue_comment_typed');
            // 2. Verify that 'Comment' button gets enabled
            await commentsTab.waitForCommentButtonEnabled();
            // 3. Verify that "Comment & Close Issue" button gets visible:
            await commentsTab.waitForCommentAndCloseIssueButtonDisplayed();
        });

    //Verify the issue: Issue Details dialog - 'No comments yet' placeholder remains visible after adding a comment #4247
    it(`GIVEN Task Details dialog is opened WHEN new comment has been typed AND Comment button has been pressed THEN expected notification should be shown`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            // 1. Open Issue Details dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Verify that Comments Tab is automatically loaded and 'No comments yet' is displayed in this tab:
            await commentsTab.waitForNoCommentsYetMessageDisplayed();
            // 3. Type text in comment area and click on 'Comment' button:
            await commentsTab.typeComment(MY_COMMENT);
            await commentsTab.clickOnCommentButton();
            // 4. Verify the notification message:
            let message = await issueDetailsDialog.waitForNotificationMessage();
            await studioUtils.saveScreenshot('issue_comment_added');
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.YOUR_COMMENT_ADDED,
                'Expected notification message should be shown when the comment has been added');
            await studioUtils.saveScreenshot('issue_comment_button_disabled');
            // 5. Verify that 'Comment' button gets disabled:
            await commentsTab.waitForCommentButtonDisabled();
            // 6.verify that 'No comments yet' message gets not visible in the Comments tab
            await commentsTab.waitForNoCommentsYetMessageNotDisplayed();
        });

    it(`WHEN Task Details dialog is opened THEN just created comment should be present in the comments-list`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            // 1. Open Issue List Dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            // 2. Open Task Details Dialog:
            await issueDetailsDialog.waitForDialogLoaded();
            let result = await commentsTab.isCommentPresent(MY_COMMENT);
            await studioUtils.saveScreenshot('issue_comment_added');
            assert.ok(result, 'Comment with the name should be present ');
        });

    it(`GIVEN existing task with a comment WHEN Task Details dialog is opened AND the comment has been changed THEN updated comment should appear in the comments-list`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            // 1. Open Task Details Dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Update the text in comment
            await commentsTab.clickOnEditCommentMenuItem(MY_COMMENT);
            await commentsTab.updateComment(MY_COMMENT, newText);
            // 3. Click on Save Comment button
            await commentsTab.clickOnSaveCommentButton(MY_COMMENT);
            // 4. Verify that new text is displayed in the comment
            let result = await commentsTab.isCommentPresent(newText);
            await studioUtils.saveScreenshot("task_comment_updated");
            assert.ok(result, 'The comment should be updated');
        });

    it(`GIVEN existing task with a comment WHEN Task Details dialog is opened AND the comment has been deleted THEN the comment should not be present in the comments-list`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let confirmationDialog = new ConfirmationDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            // 1. Click on the task and open Task Details Dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            //2. Expand menu and click on Delete Comment:
            await commentsTab.clickOnDeleteCommentMenuItem(newText);
            // 3. Confirm the deleting:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 4. Verify that comment is not displayed
            let result = await commentsTab.isCommentPresent(newText);
            await studioUtils.saveScreenshot('task_comment_deleted');
            assert.ok(result === false, 'Comment with the text should be deleted');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
