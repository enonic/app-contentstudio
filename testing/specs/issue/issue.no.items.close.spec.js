/**
 * Created on 25.05.2018.
 */
const chai = require('chai');
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
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            //1. Open Create Issue dialog:
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.typeTitle(issueTitle);
            //2. Click on Create Issue:
            await createIssueDialog.clickOnCreateIssueButton();
            await issueDetailsDialog.waitForDialogOpened();
            //Click on Items-tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            let result = await issueDetailsDialog.isNoActionLabelPresent();
            assert.isTrue(result, `No items to publish' should be displayed, because items were not selected`);
        });

    it(`GIVEN 'open' issue is selected WHEN 'Close Issue' button has been pressed THEN the issue is getting closed`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openIssuesListDialog();
            //1. Open Issue Details dialog:
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogOpened();
            //2. Click on 'Close Issue' button:
            await issueDetailsDialog.clickOnCloseIssueButton();
            studioUtils.saveScreenshot("empty_issue_closed");
            //'The issue is Closed.' - this message should appear
            await createIssueDialog.waitForExpectedNotificationMessage(appConstant.ISSUE_CLOSED_MESSAGE);
        });

    it(`GIVEN 'closed' issue is selected WHEN 'Reopen Issue' button has been pressed THEN the issue is getting 'open'`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openIssuesListDialog();
            //1. Click on 'Show Closed Issued':
            await issueListDialog.clickOnShowClosedIssuesButton();
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogOpened();
            //2. Reopen the issue:
            await issueDetailsDialog.clickOnReopenIssueButton();
            studioUtils.saveScreenshot("empty_issue_reopened");
            //3. 'The issue is Open - this message should appear:
            await createIssueDialog.waitForExpectedNotificationMessage(appConstant.ISSUE_OPENED_MESSAGE);
            let result = await issueDetailsDialog.isCloseIssueButtonDisplayed();
            assert.isTrue(result, '`Close Issue` button should be displayed, because the issue is reopened');
        });

    it(`GIVEN Issue Details dialog is opened WHEN 'Esc' key has been pressed THEN modal dialog should be closed`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            //1. Open Issues List
            await studioUtils.openIssuesListDialog();
            //2. Open Issue Details Dialog
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogOpened();
            //3. Click on Esc:
            await issueDetailsDialog.pressEscKey();
            studioUtils.saveScreenshot("issue_details_esc_key");
            //issue details dialog should be closed:
            await issueDetailsDialog.waitForDialogClosed();
            //issues list dialog should be closed:
            await issueListDialog.waitForDialogClosed();
        });

    it(`GIVEN Issue Details dialog is opened WHEN 'back-button' key has been pressed THEN Isses list dialog gets visible`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            //1. Open Issues List
            await studioUtils.openIssuesListDialog();
            //2. Open Issue Details Dialog
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogOpened();
            //3. Click on Back button:
            await issueDetailsDialog.clickOnBackButton();
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
