/**
 * Created on 21.06.2018.
 * verifies https://github.com/enonic/app-contentstudio/issues/261
 *
 * ContentItemPreviewToolbar - issues are not refreshed on the toolbar, when an issue has been closed or reopened or updated
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('contentItem.preview.toolbar.spec: create a task and check it in the preview toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let firstIssueTitle = appConst.generateRandomName('issue');
    let secondIssueTitle = appConst.generateRandomName('issue');
    let TEST_FOLDER;

    it(`GIVEN folder has been created WHEN the folder is selected THEN 'New' status should be displayed in the preview-toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1. Add new folder and select it:
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot("content_item_toolbar");
            //2.Verify that 'New' status is displayed in Item Preview toolbar:
            let status = await contentItemPreviewPanel.getContentStatus();
            assert.equal(status, "New", "New status should be displayed in the Preview Item toolbar");
            //Author should not be displayed in the toolbar:
            await contentItemPreviewPanel.waitForAuthorNotDisplayed();

        });

    //verifies "https://github.com/enonic/app-contentstudio/issues/190"
    //Preview Panel - status should not be visible when no content is selected
    it(`GIVEN existing folder is selected WHEN the folder has been unselected THEN preview toolbar gets not visible`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            //1. Select the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let contentBrowsePanel = new ContentBrowsePanel();
            //2. Unselect this folder:
            await contentBrowsePanel.clickOnRowByName(TEST_FOLDER.displayName);
            //content-status on the Preview Toolbar should be cleared
            await contentItemPreviewPanel.waitForStatusCleared();
            //content-author in the Preview Toolbar should be cleared:
            await contentItemPreviewPanel.waitForAuthorCleared();
        });

    it(`GIVEN existing 'New' folder WHEN the folder is selected and published THEN 'Published' status should be displayed in the preview toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            //1. Select the folder
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //2. Click on Mark on ready then publish the folder:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await studioUtils.doPublish();
            //3. Published status should be displayed in the item preview toolbar:
            let status = await contentItemPreviewPanel.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED, "The folder should be 'Published'");
            await contentItemPreviewPanel.waitForAuthorNotDisplayed();
        });

    it(`GIVEN existing 'published' folder is selected WHEN the first task has been created THEN menu button with the task-name should appear in the ItemPreviewToolbar`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let createTaskDialog = new CreateTaskDialog();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //1. open 'Create Task' dialog and create the first task:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(firstIssueTitle);
            await createTaskDialog.clickOnCreateTaskButton();
            //2. Close the modal dialog
            await taskDetailsDialog.clickOnCancelTopButton();
            let issueName = await contentItemPreviewPanel.getIssueNameInMenuButton();
            assert.equal(issueName, firstIssueTitle, "The task-name should be appear im the item preview toolbar");
        });

    it(`GIVEN existing 'published' folder is selected WHEN the second task has been created THEN task-name should be updated in the menu button(ItemPreviewToolbar)`,
        async () => {
            let issueDetailsDialog = new TaskDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let createTaskDialog = new CreateTaskDialog();
            //1. Select the content,expand tasks-menu and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.openPublishMenuAndClickOnCreateTask();
            //2. Create new task:
            await createTaskDialog.typeTitle(secondIssueTitle);
            await createTaskDialog.clickOnCreateTaskButton();
            //3. Close the modal dialog
            await issueDetailsDialog.clickOnCancelTopButton();
            //'Tasks-dropdown handle' should appear in the preview toolbar(the second issue is created)
            await contentItemPreviewPanel.waitForIssueDropDownHandleDisplayed();
            //Issue name should be updated in the preview panel:
            return contentItemPreviewPanel.waitForIssueNameInMenuButton(secondIssueTitle);
        });

    it(`GIVEN existing folder is selected WHEN task-menu button has been clicked THEN 'Task Details' modal dialog should appear`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            //1. Select the content,expand tasks-menu and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentItemPreviewPanel.clickOnIssueMenuButton();
            await taskDetailsDialog.waitForDialogOpened();
            studioUtils.saveScreenshot("task_menu_button_clicked");
            let title = await taskDetailsDialog.getIssueTitle();
            assert.equal(title, secondIssueTitle, "required task-name should be loaded in the modal dialog");
        });

    it(`GIVEN existing folder with 2 tasks is selected AND dropdown in the issue-menu has been clicked WHEN click on the menu-item in the dropdown list THEN 'Task Details' modal dialog should appear with correct tittle`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            //1. Select the content,expand tasks-menu and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentItemPreviewPanel.clickOnIssueMenuDropDownHandle();
            await contentItemPreviewPanel.clickOnIssueMenuItem(firstIssueTitle);
            await taskDetailsDialog.waitForDialogOpened();
            studioUtils.saveScreenshot("task_menu_item_clicked");
            let title = await taskDetailsDialog.getIssueTitle();
            assert.equal(title, firstIssueTitle, "required task-name should be loaded in the modal dialog");
        });

    //verifies  https://github.com/enonic/app-contentstudio/issues/721
    //drop down handle for issues remains after the content is unselected
    it(`GIVEN existing folder with 2 tasks is selected WHEN this folder has been unselected THEN 'tasks drop down handle' gets not visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            //select the folder with 2 issues:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //Drop down handle for issues should be displayed on the Preview Panel:
            await contentItemPreviewPanel.waitForIssueDropDownHandleDisplayed();
            //unselect the folder:
            await contentBrowsePanel.clickOnRowByDisplayName(TEST_FOLDER.displayName);
            //Drop down handle for issues gets not visible(exception will be thrown after the timeout)
            await contentItemPreviewPanel.waitForIssueDropDownHandleNotDisplayed();
        });
    //verifies https://github.com/enonic/app-contentstudio/issues/261. ContentItemPreviewToolbar - issues are not refreshed on the toolbar
    it(`GIVEN folder(2 tasks) was selected and 'IssueDetails' dialog is opened WHEN the task has been closed THEN task-name should be updated in the task-menu(Preview toolbar)`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1. Select the folder and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentItemPreviewPanel.clickOnIssueMenuButton();
            await taskDetailsDialog.waitForDialogOpened();
            //2. Close the task:
            await taskDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            //3. Close the modal dialog:
            await taskDetailsDialog.clickOnCancelTopButton();
            studioUtils.saveScreenshot("issue_menu_button_updated");
            //issue name should be updated in tne preview panel:
            await contentItemPreviewPanel.waitForIssueNameInMenuButton(firstIssueTitle);
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
