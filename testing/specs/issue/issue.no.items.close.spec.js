/**
 * Created on 25.05.2018.
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

describe('issue.no.items.spec: create issue without items, close the issue and reopen the issue again', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    it(`WHEN new issue without items has been created THEN 'No items to publish' should be displayed in the Items-tab`,
        () => {
            let createIssueDialog = new CreateIssueDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            return studioUtils.openCreateIssueDialog().then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(() => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(result => {
                return assert.eventually.isTrue(issueDetailsDialog.isNoActionLabelPresent(),
                    '`No items to publish` should be displayed, because items were not selected');
            });
        });

    it(`GIVEN 'open' issue is selected WHEN 'Close Issue' button has been pressed THEN the issue is getting closed`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnCloseIssueButton();
            }).then(() => {
                return createIssueDialog.waitForExpectedNotificationMessage(appConstant.ISSUE_CLOSED_MESSAGE);
            }).then(result => {
                studioUtils.saveScreenshot("empty_issue_closed");
                return assert.isTrue(result, 'Correct notification should appear');
            });
        });

    it(`GIVEN 'closed' issue is selected WHEN 'Reopen Issue' button has been pressed THEN the issue is getting 'open'`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnShowClosedIssuesButton();
            }).then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnReopenIssueButton();
            }).then(() => {
                return createIssueDialog.waitForExpectedNotificationMessage(appConstant.ISSUE_OPENED_MESSAGE);
            }).then(result => {
                studioUtils.saveScreenshot("empty_issue_reopened");
                return assert.isTrue(result, 'The issue is Open. - notification message should appear');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialog.isCloseIssueButtonDisplayed(),
                    '`Close Issue` button should be displayed, because the issue is reopened');
            });
        });

    it(`GIVEN Issue Details dialog is opened WHEN 'Esc' key has been pressed THEN Issue List Dialog should be loaded`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.pressEscKey();
            }).then(() => {
                //issues list dialog should be loaded
                return issueListDialog.waitForDialogOpened();
            }).then(result => {
                studioUtils.saveScreenshot("issue_details_esc_key");
                return assert.isTrue(result, 'Issues list dialog should be loaded');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
