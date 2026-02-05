/**
 * Created on 25.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const appConst = require('../../libs/app_const');

describe('close.issue.without.items.spec: create an issue without items, close the issue and reopen it again', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let issueTitle = appConst.generateRandomName('issue');

    it(`WHEN new issue without items has been created THEN 'No items to publish' should be displayed in the Items-tab`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            // 1. Open Create Issue dialog:
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.typeTitle(issueTitle);
            // 2. Click on Create Issue:
            await createIssueDialog.clickOnCreateIssueButton();
            await issueDetailsDialog.waitForDialogLoaded();
            // Click on Items-tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            let result = await issueDetailsDialog.isNoActionLabelPresent();
            assert.ok(result, `No items to publish' should be displayed, because items were not selected`);
        });

    it(`GIVEN existing 'open' issue is clicked and Issue Details dialog is opened WHEN 'Close Issue' button has been pressed THEN the issue gets 'Closed'`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            await studioUtils.openIssuesListDialog();
            // 1. Click on the task and open Task Details dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Click on 'Closed' tab menu button:
            await issueDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            await studioUtils.saveScreenshot('empty_issue_closed');
            // 'The issue is Closed.' - this message should appear
            await issueDetailsDialog.waitForExpectedNotificationMessage(appConst.NOTIFICATION_MESSAGES.ISSUE_CLOSED_MESSAGE);
        });

    it(`GIVEN 'closed' issue is clicked and Issue Details dialog is opened WHEN 'Reopen Issue' button has been pressed THEN the tsk gets 'Open'`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            await studioUtils.openIssuesListDialog();
            // 1. Click on 'Closed' button and load 'closed' issues:
            await issueListDialog.clickOnClosedTabButton();
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Reopen the issue:
            // TODO epic-enonic-ui  reopen  the issue
            await issueDetailsDialog.clickOnReopenIssueButton();
            await studioUtils.saveScreenshot('empty_issue_reopened');
            // 3. 'The issue is Open - this message should appear:
            await issueDetailsDialog.waitForExpectedNotificationMessage(appConst.NOTIFICATION_MESSAGES.ISSUE_OPENED_MESSAGE);
            let actualStatus = await issueDetailsDialog.getCurrentStatusInStatusSelector();
            assert.equal(actualStatus, 'Open', "'Open' status should be displayed in status selector button");
        });

    it(`GIVEN Issue Details dialog is opened WHEN 'Esc' key has been pressed THEN modal dialog should be closed`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            // 1. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            // 2. Open Issue Details Dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogLoaded();
            // 3. Click on Esc:
            await issueDetailsDialog.pressEscKey();
            await studioUtils.saveScreenshot('issue_details_esc_key');
            // issue details dialog should be closed:
            await issueDetailsDialog.waitForDialogClosed();
            // issues list dialog should be closed:
            await issueListDialog.waitForDialogClosed();
        });

    it(`GIVEN Issue Details dialog is opened WHEN 'back-button' key has been pressed THEN Issues list dialog gets visible`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            // 1. Open Issues List
            await studioUtils.openIssuesListDialog();
            // 2. Open Task Details Dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogLoaded();
            // 3. Click on Back button:
            await issueDetailsDialog.clickOnBackButton();
            await studioUtils.saveScreenshot('issue_details_back_clicked');
            // issues list dialog should be loaded:
            await issueListDialog.waitForDialogOpened();
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
