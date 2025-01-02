/**
 * Created on 08.07.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');

describe('issue.status.selector.spec: open and close issue by clicking on menu buttons, save and update the issue', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const ISSUE_TITLE = appConst.generateRandomName('issue');
    const newTitle = 'new title';

    let TEST_FOLDER;
    it(`Precondition: create a folder and create new issue`, async () => {
        let issueDetailsDialog = new IssueDetailsDialog();
        let createIssueDialog = new CreateIssueDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        let displayName = contentBuilder.generateRandomName('folder');
        TEST_FOLDER = contentBuilder.buildFolder(displayName);
        await studioUtils.doAddReadyFolder(TEST_FOLDER);
        await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
        // open 'Create Issue' dialog and create new issue:
        await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
        await createIssueDialog.typeTitle(ISSUE_TITLE);
        await createIssueDialog.clickOnCreateIssueButton();
        // issue details dialog should be loaded
        await issueDetailsDialog.waitForDialogLoaded();
    });

    it(`GIVEN existing 'open' issue AND Issue Details Dialog is opened WHEN 'Status menu' has been expanded and 'Closed'-item selected THEN issue gets 'Closed' and 'Reopen Issue' button gets visible`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the folder and click on the task-name in the Preview Toolbar:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.clickOnShowIssuesListButton();
            await issueListDialog.waitForDialogOpened();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();

            // 2. Expand the status menu and close the task:
            await issueDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            await studioUtils.saveScreenshot('status_menu_closed_task');
            await issueDetailsDialog.waitForExpectedNotificationMessage(appConst.NOTIFICATION_MESSAGES.ISSUE_CLOSED_MESSAGE);
            // 3. 'Reopen Issue' button should appear in the Details dialog:
            await issueDetailsDialog.waitForReopenButtonDisplayed();
        });

    it(`GIVEN existing 'closed' task WHEN 'Issue Details' dialog is opened THEN title input should not be editable`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            await studioUtils.openIssuesListDialog();
            // 1. Click on 'Closed' button (load closed issues):
            await issueListDialog.clickOnClosedButton();
            // 2. Click on the closed task and open task-details dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 3.  the task should not be editable, because this task is closed:
            await issueDetailsDialog.waitForIssueTitleInputNotEditable();
        });

    it(`GIVEN existing 'closed' task AND 'Details Dialog' is opened WHEN 'Status menu' has been opened and 'Open' item selected THEN the task gets 'open'`,
        async () => {
            let taskDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            await studioUtils.openIssuesListDialog();
            // 1. Click on 'Closed' button in the Issues List dialog:
            await issueListDialog.clickOnClosedButton();
            // 2. Click on the task:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await taskDetailsDialog.waitForDialogLoaded();
            // 3. Click on 'Open' menu item:
            await taskDetailsDialog.clickOnIssueStatusSelectorAndOpenIssue();
            await studioUtils.saveScreenshot('status_menu_task_reopened');
            // 4. 'The task is opened' - this message should appear:
            await taskDetailsDialog.waitForExpectedNotificationMessage(appConst.NOTIFICATION_MESSAGES.ISSUE_OPENED_MESSAGE);
            // 5. 'Open' text should appear in the status selector button:
            let actualStatus = await taskDetailsDialog.getCurrentStatusInStatusSelector();
            assert.equal(actualStatus, 'Open', "'Open' status should be displayed in the status selector button");
        });

    it.skip(
        `GIVEN existing 'open' issue has been clicked AND Details Dialog is opened WHEN 'issue-title' has been updated NEW new title should be displayed in the dialog`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.openIssuesListDialog()
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();

            await issueDetailsDialog.clickOnEditTitle();
            await issueDetailsDialog.pause(5000);
            await issueDetailsDialog.updateTitle(newTitle);

            //just for closing edit mode in title-input:
            await issueDetailsDialog.clickOnCommentsTabBarItem();
            let result = await issueDetailsDialog.waitForNotificationMessage();
            await studioUtils.saveScreenshot('issue_title_updated');
            assert.equal(result, 'Issue has been updated.', 'Expected notification should appear');

            let actualTitle = await issueDetailsDialog.getIssueTitle();
            assert.equal(actualTitle, newTitle, 'Expected and actual title should be equal');
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
