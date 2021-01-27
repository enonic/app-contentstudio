/**
 * Created on 13.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('close.task.with.item.spec: close an task and verify control elements on the ItemPreview Panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('task');
    let TEST_FOLDER;

    //verifies https://github.com/enonic/app-contentstudio/issues/356
    //Endless spinner after clicking on Create Issue button
    it(`GIVEN no selections in the grid WHEN 'Create Task...' button has been pressed  THEN Create Task dialog should appear`,
        async () => {
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.clickOnCreateTaskButton();
            await createTaskDialog.waitForDialogLoaded();
            await createTaskDialog.waitForSpinnerNotVisible(appConstant.TIMEOUT_5);
        });

    it(`Precondition: new folder and new task have been created`,
        async() => {
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.waitForPublishButtonVisible();
            //2.expand the menu and open 'Create Task' dialog
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(issueTitle);
            //3. Save the task:
            await createTaskDialog.clickOnCreateTaskButton();
            await taskDetailsDialog.waitForDialogOpened();
        });

    it(`GIVEN folder is selected in grid AND 'Task Details Dialog' is opened WHEN 'Close Task' button has been pressed THEN task-menu button gets not visible in Preview Panel`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentItemPreviewPanel.clickOnIssueMenuButton();
            await taskDetailsDialog.waitForDialogOpened();
            //the task has been closed:
            await taskDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            //modal dialog has been closed:
            await taskDetailsDialog.clickOnCancelTopButton();
            //Verify that 'issue-menu' button gets not visible in the preview toolbar, (the content is selected);
            await contentItemPreviewPanel.waitForIssueMenuButtonNotVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
