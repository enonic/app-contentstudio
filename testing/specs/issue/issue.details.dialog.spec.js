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
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const IssueDetailsDialogCommentsTab = require('../../page_objects/issue/issue.details.dialog.comments.tab');

describe('issue.details.dialog.spec: add a comment and check CommentsTabItem', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let MY_COMMENT = appConstant.generateRandomName('comment');
    let ISSUE_TITLE = appConstant.generateRandomName('issue');
    let newText = "Comment is updated";

    it(`WHEN new empty issue has been created THEN expected notification should be displayed`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnCreateIssueButton();
            let message = await createIssueDialog.waitForNotificationMessage();
            return assert.equal(message, 'New issue created successfully.', 'expected notification message should appear');
        });

    it(`GIVEN issues list dialog is opened WHEN existing issue has been clicked THEN Issue Details dialog should be loaded`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogOpened();
            let isActive = await issueDetailsDialog.isCommentsTabBarItemActive();
            assert.isTrue(isActive, 'Comments Tab should be active');

            let isCloseButtonDisplayed = await issueDetailsDialog.isCloseIssueButtonDisplayed();
            assert.isTrue(isCloseButtonDisplayed, 'Close Issue button should be present');

            //Comment button should be disabled, because it is empty.
            let isCommentButtonDisabled = await commentsTab.isCommentButtonEnabled();
            assert.isFalse(isCommentButtonDisabled, 'Comment button should be disabled');

            let isTextAreaDisplayed = await commentsTab.isCommentTextAreaDisplayed();
            assert.isTrue(isTextAreaDisplayed, 'Text area for comments should be displayed');
        });

    it(`GIVEN issue Details dialog is opened WHEN comment has been typed in the area THEN Comment button is getting enabled`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(ISSUE_TITLE);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.typeComment(MY_COMMENT);
            }).then(() => {
                studioUtils.saveScreenshot("issue_comment_typed");
                return assert.eventually.isTrue(commentsTab.waitForCommentButtonEnabled(), 'Comment button is getting enabled');
            });
        });

    it(`GIVEN Issue Details dialog is opened WHEN comment has been typed AND Comment button has been pressed THEN expected notification should be shown`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(ISSUE_TITLE);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.typeComment(MY_COMMENT);
            }).then(() => {
                return commentsTab.clickOnCommentButton();
            }).then(() => {
                return issueDetailsDialog.waitForNotificationMessage();
            }).then(message => {
                studioUtils.saveScreenshot("issue_comment_added");
                assert.equal(message, appConstant.YOUR_COMMENT_ADDED,
                    'Expected notification message should be shown when the comment has been added');
            }).then(() => {
                studioUtils.saveScreenshot("issue_comment_button_disabled");
                return assert.eventually.isTrue(commentsTab.waitForCommentButtonDisabled(), 'Comment button is getting disabled');
            });
        });

    it(`WHEN Issue Details dialog is opened THEN just created comment should be present in the comments-list`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(ISSUE_TITLE);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.isCommentPresent(MY_COMMENT);
            }).then(result => {
                studioUtils.saveScreenshot("issue_comment_added");
                assert.isTrue(result, 'Comment with the name should be present ');
            })
        });

    it(`GIVEN existing issue with a comment WHEN Issue Details dialog is opened  AND the comment has been changed THEN updated comment should be present in the comments-list`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(ISSUE_TITLE);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.clickOnEditCommentMenuItem(MY_COMMENT);
            }).then(() => {
                return commentsTab.updateComment(MY_COMMENT, newText);
            }).then(() => {
                return commentsTab.clickOnSaveCommentButton(MY_COMMENT);
            }).then(() => {
                return commentsTab.isCommentPresent(newText);
            }).then(result => {
                studioUtils.saveScreenshot("issue_comment_updated");
                assert.isTrue(result, 'Comment with the new text should be present ');
            })
        });

    it(`GIVEN existing issue with a comment WHEN Issue Details dialog is opened  AND the comment has been deleted THEN the comment should not be present in the comments-list`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let confirmationDialog = new ConfirmationDialog();
            let commentsTab = new IssueDetailsDialogCommentsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(ISSUE_TITLE);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return commentsTab.clickOnDeleteCommentMenuItem(newText);
            }).then(() => {
                return confirmationDialog.waitForDialogOpened();
            }).then(() => {
                return confirmationDialog.clickOnYesButton();
            }).then(() => {
                return commentsTab.isCommentPresent(newText);
            }).then(result => {
                studioUtils.saveScreenshot("issue_comment_deleted");
                assert.isFalse(result, 'Comment with the text should be deleted');
            })
        });
    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
})
;
