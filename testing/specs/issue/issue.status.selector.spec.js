/**
 * Created on 08.07.2018.
 *
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
;
const contentBuilder = require("../../libs/content.builder");
const contentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('issue.status.selector.spec: open and close issue by clicking on menu buttons, edit issue-title, save and update the issue',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let issueTitle = appConstant.generateRandomName('issue');
        let newTitle = "new title";

        let TEST_FOLDER;
        it(`Precondition: create a folder and create new issue`, () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            return studioUtils.doAddFolder(TEST_FOLDER).then(() => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            }).then(() => {
                return studioUtils.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            })
        });

        it(`GIVEN existing 'open' issue AND Issue Details Dialog is opened WHEN 'Status menu' has been opened and 'Closed'-item selected THEN issue should be 'Closed' and 'Reopen Issue' button is getting visible`,
            () => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                    return contentItemPreviewPanel.clickOnIssueMenuButton();
                }).then(() => {
                    return issueDetailsDialog.waitForDialogLoaded();
                }).then(() => {
                    return issueDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
                }).then(() => {
                    return issueDetailsDialog.waitForNotificationMessage();
                }).then(messages => {
                    studioUtils.saveScreenshot('status_menu_closed_issue');
                    assert.isTrue(messages == appConstant.ISSUE_CLOSED_MESSAGE, 'notification message should be displayed');
                }).then(() => {
                    return assert.eventually.isTrue(issueDetailsDialog.waitForReopenButtonLoaded(),
                        '`Reopen Issue` button should be loaded');
                }).then(() => {
                    return assert.eventually.isTrue(issueDetailsDialog.waitForIssueTitleInputToggleNotVisible(),
                        '`Edit title` toggle is getting hidden');
                });
            });

        it(`GIVEN existing 'closed' issue WHEN 'Issue Details'  Dialog is opened THEN 'Edit' button should not be visible on the dialog header`,
            () => {
                return studioUtils.openIssuesListDialog().then(() => {
                    return issueListDialog.clickOnShowClosedIssuesLink();
                }).pause(500).then(() => {
                    return issueListDialog.clickOnIssue(issueTitle);
                }).then(() => {
                    return issueDetailsDialog.waitForDialogLoaded();
                }).then(() => {
                    return issueDetailsDialog.waitForIssueTitleInputToggleNotVisible();
                }).then(result => {
                    studioUtils.saveScreenshot("issue_details_edit_toggle_hidden");
                    return assert.isTrue(result, 'Edit toggle should not be visible, because the issue is closed');
                });
            });

        it(`GIVEN existing 'closed' issue AND 'Details Dialog' is opened WHEN 'Status menu' has been opened and 'Open' item selected THEN the issue is getting 'open' AND 'Close Issue' button is getting visible`,
            () => {
                return studioUtils.openIssuesListDialog().then(() => {
                    return issueListDialog.isShowClosedIssuesLinkVisible().then(result => {
                        if (result) {
                            return issueListDialog.clickOnShowClosedIssuesLink();
                        }
                    })
                }).pause(500).then(() => {
                    return issueListDialog.clickOnIssue(issueTitle);
                }).then(() => {
                    return issueDetailsDialog.waitForDialogLoaded();
                }).then(() => {
                    return issueDetailsDialog.clickOnIssueStatusSelectorAndOpenIssue();
                }).then(() => {
                    return createIssueDialog.waitForExpectedNotificationMessage(appConstant.ISSUE_OPENED_MESSAGE);
                }).then(result => {
                    studioUtils.saveScreenshot("status_menu_issue_reopened");
                    return assert.isTrue(result, 'Correct notification should appear');
                }).then(() => {
                    return assert.eventually.isTrue(issueDetailsDialog.waitForCloseButtonLoaded(),
                        '`Close Issue` button should be displayed on the dialog, because the issue is reopened');
                });
            });

        it(`GIVEN existing 'open' issue AND Details Dialog is opened WHEN 'issue-title' has been updated NEW new title should be displayed on the dialog`,
            () => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                    return contentItemPreviewPanel.clickOnIssueMenuButton();
                }).then(() => {
                    return issueDetailsDialog.waitForDialogLoaded();
                }).then(() => {
                    return issueDetailsDialog.clickOnIssueTitleInputToggle();
                }).then(() => {
                    return issueDetailsDialog.typeTitle(newTitle);
                }).then(() => {
                    return issueDetailsDialog.clickOnIssueTitleInputToggle();
                }).then(() => {
                    return createIssueDialog.waitForNotificationMessage();
                }).then(result => {
                    studioUtils.saveScreenshot("issue_title_updated");
                    return assert.isTrue(result == 'Issue has been updated.', 'Correct notification should appear');
                }).then(() => {
                    return expect(issueDetailsDialog.getIssueTitle()).to.eventually.equal(newTitle);
                });
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
