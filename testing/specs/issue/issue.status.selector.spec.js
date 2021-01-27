/**
 * Created on 08.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('issue.status.selector.spec: open and close task by clicking on menu buttons, edit task-title, save and update the task',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let TASK_TITLE = appConstant.generateRandomName('task');
        let newTitle = "new title";

        let TEST_FOLDER;
        it(`Precondition: create a folder and create new task`, async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //open 'Create Task' dialog and create new task:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(TASK_TITLE);
            await createTaskDialog.clickOnCreateTaskButton();
            //issue details dialog should be loaded
            await taskDetailsDialog.waitForDialogOpened();
        });

        it(`GIVEN existing 'open' issue AND Task Details Dialog is opened WHEN 'Status menu' has been expanded and 'Closed'-item selected THEN task gets 'Closed' and 'Reopen Issue' button gets visible`,
            async () => {
                let taskDetailsDialog = new TaskDetailsDialog();
                let contentItemPreviewPanel = new ContentItemPreviewPanel();
                //1. Select the folder and click on the task-name in the Preview Toolbar:
                await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
                await contentItemPreviewPanel.clickOnIssueMenuButton();
                await taskDetailsDialog.waitForDialogOpened();
                //2. Expand the status menu and close the task:
                await taskDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
                studioUtils.saveScreenshot('status_menu_closed_task');
                await taskDetailsDialog.waitForExpectedNotificationMessage(appConstant.TASK_CLOSED_MESSAGE);
                //3. 'Reopen Task' button should appear in the details dialog:
                await taskDetailsDialog.waitForReopenButtonLoaded();
            });

        it(`GIVEN existing 'closed' task WHEN 'Task Details' dialog is opened THEN title input should not be editable`,
            async () => {
                let taskDetailsDialog = new TaskDetailsDialog();
                let issueListDialog = new IssueListDialog();
                await studioUtils.openIssuesListDialog();
                //1. Click on 'Closed' button (load closed issues):
                await issueListDialog.clickOnClosedButton();
                //2. Click on the closed task and open task-details dialog:
                await issueListDialog.clickOnIssue(TASK_TITLE);
                await taskDetailsDialog.waitForDialogOpened();
                // the task should not be editable, because this task is closed:
                await taskDetailsDialog.waitForIssueTitleInputNotEditable();
            });

        it(`GIVEN existing 'closed' task AND 'Details Dialog' is opened WHEN 'Status menu' has been opened and 'Open' item selected THEN the task gets 'open'`,
            async () => {
                let taskDetailsDialog = new TaskDetailsDialog();
                let issueListDialog = new IssueListDialog();
                await studioUtils.openIssuesListDialog();
                //1. Click on 'Closed' button in the Issues List dialog:
                await issueListDialog.clickOnClosedButton();
                //2. Click on the task:
                await issueListDialog.clickOnIssue(TASK_TITLE);
                await taskDetailsDialog.waitForDialogOpened();
                //3. Click on 'Open' menu item:
                await taskDetailsDialog.clickOnIssueStatusSelectorAndOpenIssue();
                studioUtils.saveScreenshot("status_menu_task_reopened");
                //4. 'The task is opened' - this message should appear:
                await taskDetailsDialog.waitForExpectedNotificationMessage(appConstant.TASK_OPENED_MESSAGE);
                //5. 'Open' text should appear in the status selector button:
                let actualStatus = await taskDetailsDialog.getCurrentStatusInStatusSelector();
                assert.equal(actualStatus, "Open", "'Open' status should be displayed in the status selector button");
            });

        it.skip(
            `GIVEN existing 'open' issue has been clicked AND Details Dialog is opened WHEN 'issue-title' has been updated NEW new title should be displayed in the dialog`,
            async () => {
                let taskDetailsDialog = new TaskDetailsDialog();
                let contentItemPreviewPanel = new ContentItemPreviewPanel();
                await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
                await contentItemPreviewPanel.clickOnIssueMenuButton();
                await taskDetailsDialog.waitForDialogOpened();

                await taskDetailsDialog.clickOnEditTitle();
                await taskDetailsDialog.pause(5000);
                await taskDetailsDialog.updateTitle(newTitle);

                //just for closing edit mode in title-input:
                await taskDetailsDialog.clickOnCommentsTabBarItem();
                let result = await taskDetailsDialog.waitForNotificationMessage();
                studioUtils.saveScreenshot("issue_title_updated");
                assert.equal(result, 'Issue has been updated.', 'Expected notification should appear');

                let actualTitle = await taskDetailsDialog.getIssueTitle();
                assert.equal(actualTitle, newTitle, 'Expected and actual title should be equal');
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    })
;
