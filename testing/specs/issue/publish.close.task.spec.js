/**
 * Created on 21.02.2018.
 * verifies
 * 1. https://github.com/enonic/app-contentstudio/issues/246
 *  Issue List Dialog - closed issues are not displayed until you create a new issue
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const TaskDetailsDialogItemsTab = require('../../page_objects/issue/task.details.items.tab');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const appConst = require('../../libs/app_const');

describe('publish.close.task.spec: publish a content and close the task.', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let TASK_TITLE = appConst.generateRandomName('task');
    let TEST_FOLDER;

    it(`Precondition: create new folder and create new task for it`, async () => {
        let taskDetailsDialog = new TaskDetailsDialog();
        let createTaskDialog = new CreateTaskDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        let displayName = contentBuilder.generateRandomName('folder');
        TEST_FOLDER = contentBuilder.buildFolder(displayName);
        //1. Do add new 'Marked as ready' folder:
        await studioUtils.doAddReadyFolder(TEST_FOLDER);
        //2. Select the folder:
        await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
        //3. Open 'Create Issue' dialog
        await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
        await createTaskDialog.typeTitle(TASK_TITLE);
        //Click on 'Create Task' button and create new issue:
        await createTaskDialog.clickOnCreateTaskButton();
        await taskDetailsDialog.waitForDialogOpened();
    });

    // Verifies: Issue is not closed after publishing (#1301).
    it(`GIVEN Issue Details Dialog is opened AND Items-tab activated WHEN 'Publish...' button has been pressed AND 'Publish Now' has been pressed in the loaded wizard THEN the content should be published`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            //1. Open issues-list dialog and click on the task:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Go to Items tab:
            await taskDetailsDialog.clickOnItemsTabBarItem();
            //3. Click on Publish... button and open Publish Wizard dialog:
            await taskDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            //4. Click on 'Publish Now' button in the Publish Wizard dialog:
            await contentPublishDialog.clickOnPublishNowButton();
            //4. Verify the notification message:
            let message = await taskDetailsDialog.waitForNotificationMessage();
            let expected = appConst.itemPublishedNotificationMessage(TEST_FOLDER.displayName);
            assert.equal(message, expected, 'expected message should be displayed');
            //5. 'Reopen Task' button should appear in the bottom of the dialog:
            await taskDetailsDialogItemsTab.waitForReopenTaskButtonDisplayed();
        });

    //verifies: Issue List Dialog - closed issues are not displayed until you create a new issue (app-contentstudio/issues/246)
    it(`GIVEN just closed task WHEN issue list dialog opened THEN the task should be present in 'closed' issues`,
        async () => {
            let issueListDialog = new IssueListDialog();
            //1. Open Issues List Dialog:
            await studioUtils.openIssuesListDialog();
            studioUtils.saveScreenshot("verify_issue_246");
            //2. Go to closed issues:
            await issueListDialog.clickOnClosedButton();
            studioUtils.saveScreenshot('navigate_closed_issues');
            let result = await issueListDialog.isIssuePresent(TASK_TITLE);
            assert.isTrue(result, 'required task should be present in `closed issues`');
        });

    it(`GIVEN task is published and closed WHEN when content that is present in the task is selected in the grid THEN Published status should be displayed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the content in the browse panel:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //2. Get status of the content:
            let status = await contentBrowsePanel.getContentStatus(TEST_FOLDER.displayName);
            studioUtils.saveScreenshot('content_should_be_published');
            assert.equal(status, 'Published', 'Content should be published, because the issue has been published');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
