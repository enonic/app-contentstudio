/**
 * Created on 21.02.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const appConst = require('../../libs/app_const');

describe('publish.close.issue.spec: publish a content and close the issue.', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let ISSUE_TITLE = appConst.generateRandomName('issue');
    let TEST_FOLDER;

    it(`Precondition: create new folder and create new issue for it`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Do add new 'Marked as ready' folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            // 2. Select the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 3. Open 'Create Issue' dialog
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            // Click on 'Create Issue' button and create new issue:
            await createIssueDialog.clickOnCreateIssueButton();
            await issueDetailsDialog.waitForDialogLoaded();
        });

    // Verifies: Issue is not closed after publishing (#1301).
    it(`GIVEN Issue Details Dialog is opened AND Items-tab activated WHEN 'Publish...' button has been pressed AND 'Publish Now' has been pressed in the loaded wizard THEN the content should be published`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Open issues-list dialog and click on the task:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Go to Items tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Click on Publish... button and open Publish Wizard dialog:
            await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 4. Click on 'Publish Now' button in 'Publish Wizard' dialog:
            await contentPublishDialog.clickOnPublishNowButton();
            // 5. Verify the notification message:
            let message = await issueDetailsDialog.waitForNotificationMessage();
            let expected = appConst.itemPublishedNotificationMessage(TEST_FOLDER.displayName);
            assert.equal(message, expected, 'expected message should be displayed');
            // 6. 'Reopen Issue' button should appear in the bottom of the dialog:
            await issueDetailsDialogItemsTab.waitForReopenIssueButtonDisplayed();
        });

    //verifies: Issue List Dialog - closed issues are not displayed until you create a new issue (app-contentstudio/issues/246)
    it(`GIVEN just closed task WHEN issue list dialog opened THEN the task should be present in 'closed' issues`,
        async () => {
            let issueListDialog = new IssueListDialog();
            // 1. Open Issues List Dialog:
            await studioUtils.openIssuesListDialog();
            await studioUtils.saveScreenshot('verify_issue_246');
            // 2. Go to closed issues:
            await issueListDialog.clickOnClosedTabButton();
            await studioUtils.saveScreenshot('navigate_closed_issues');
            let result = await issueListDialog.isIssuePresent(ISSUE_TITLE);
            assert.ok(result, 'required issue should be present in `closed issues`');
        });

    it(`GIVEN issue is published and closed WHEN when content that is present in the task is selected in the grid THEN Published status should be displayed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the content in the browse panel:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Get status of the content:
            let status = await contentBrowsePanel.getContentStatus(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('content_should_be_published');
            assert.equal(status, 'Published', 'Content should be published, because the issue has been published');
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
