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
const issueListDialog = require('../../page_objects/issue/issue.list.dialog');
const createIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const issueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const confirmationDialog = require('../../page_objects/confirmation.dialog');


describe('issue.details.dialog.spec: add a comment and check CommentsTabItem', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let MY_COMMENT = appConstant.generateRandomName('comment');
    let issueTitle = appConstant.generateRandomName('issue');
    let newText = "Comment is updated";

    it(`WHEN new issue has been created THEN correct notification should be displayed`,
        () => {
            return studioUtils.openCreateIssueDialog().then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return createIssueDialog.waitForNotificationMessage();
            }).then(result => {
                return assert.isTrue(result == 'New issue created successfully.', 'correct notification message should appear');
            });
        });

    it(`GIVEN issues list dialog is opened WHEN issue has been clicked THEN Issue Details dialog should be displayed`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.isCommentsTabBarItemActive();
            }).then(result => {
                assert.isTrue(result, 'Comments Tab should be active');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialog.isCloseIssueButtonDisplayed(), 'Close Issue button should be present');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialog.isAddCommentButtonDisplayed(), 'Add Comment button should be displayed');
            }).then(() => {
                return assert.eventually.isFalse(issueDetailsDialog.isAddCommentButtonEnabled(), 'Add Comment button should be disabled');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialog.isCommentTextAreaDisplayed(),
                    'Text area for comments should be displayed');
            })
        });

    it(`GIVEN issue Details dialog is opened WHEN comment typed in the area THEN Add Comment is getting enabled`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.typeComment(MY_COMMENT);
            }).then(() => {
                studioUtils.saveScreenshot("issue_comment_typed");
                return assert.eventually.isTrue(issueDetailsDialog.waitForAddCommentButtonEnabled(),
                    'Add Comment button is getting enabled');
            });
        });

    it(`GIVEN Issue Details dialog is opened WHEN comment typed AND add comment button has been pressed THEN correct notification should be shown`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.typeComment(MY_COMMENT);
            }).then(() => {
                return issueDetailsDialog.clickOnAddCommentButton();
            }).then(() => {
                return issueDetailsDialog.waitForNotificationMessage();
            }).then((message) => {
                studioUtils.saveScreenshot("issue_comment_added");
                assert.isTrue(message == 'Your comment is added to issue',
                    'Correct notification message should be shown when the comment has been added');
            }).then(() => {
                studioUtils.saveScreenshot("issue_comment_button_disabled");
                return assert.eventually.isTrue(issueDetailsDialog.waitForAddCommentButtonDisabled(),
                    'Add Comment button is getting disabled');
            });
        });

    it(`WHEN Issue Details dialog is opened THEN just created comment should be present in the comments-list`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.isCommentPresent(MY_COMMENT);
            }).then((result) => {
                studioUtils.saveScreenshot("issue_comment_added");
                assert.isTrue(result, 'Comment with the name should be present ');
            })
        });

    it(`GIVEN existing issue with a comment WHEN Issue Details dialog is opened  AND the comment has been changed THEN updated comment should be present in the comments-list`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnEditCommentMenuItem(MY_COMMENT);
            }).then(() => {
                return issueDetailsDialog.updateComment(MY_COMMENT, newText);
            }).then(() => {
                return issueDetailsDialog.clickOnSaveCommentButton(MY_COMMENT);
            }).then(() => {
                return issueDetailsDialog.isCommentPresent(newText);
            }).then((result) => {
                studioUtils.saveScreenshot("issue_comment_updated");
                assert.isTrue(result, 'Comment with the new text should be present ');
            })
        });

    it(`GIVEN existing issue with a comment WHEN Issue Details dialog is opened  AND the comment has been deleted THEN the comment should not be present in the comments-list`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnDeleteCommentMenuItem(newText);
            }).then(() => {
                return confirmationDialog.waitForDialogVisible();
            }).then(() => {
                return confirmationDialog.clickOnYesButton();
            }).then(() => {
                return issueDetailsDialog.isCommentPresent(newText);
            }).then((result) => {
                studioUtils.saveScreenshot("issue_comment_deleted");
                assert.isFalse(result, 'Comment with the text should be deleted');
            })
        });
    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
