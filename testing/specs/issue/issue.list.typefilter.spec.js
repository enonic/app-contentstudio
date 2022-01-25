/**
 * Created on 29.11.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const csConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');

describe(`issue.list.type.filter.spec: tests 'Type Filter' in Issues List modal dialog`, function () {
    this.timeout(csConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TASK_TITLE = csConst.generateRandomName('task');
    let TEST_FOLDER;
    let PUBLISH_REQUEST_TITLE = "my first request";

    it(`Precondition: new folder and new task should be created`,
        async () => {
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.waitForPublishButtonVisible();
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(TASK_TITLE);
            //2. Create new task:
            await createTaskDialog.clickOnCreateTaskButton();
            await taskDetailsDialog.waitForDialogOpened();
        });

    it(`Precondition: new request publish should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new  CreateRequestPublishDialog();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(csConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput(PUBLISH_REQUEST_TITLE);
            await createRequestPublishDialog.clickOnCreateRequestButton();
        });

    it(`GIVEN Issue List dialog is opened WHEN dropdown handle in Type Filter selector has been clicked THEN expected options should be present in the selector`,
        async () => {
            let issueListDialog = new IssueListDialog();
            //1.Open Issue List dialog:
            await studioUtils.openIssuesListDialog();
            //2. Click on the dropdown handle and expand the selector:
            let result = await issueListDialog.getTypeFilterOptions();
            assert.isTrue(result[0].includes(csConst.ISSUE_LIST_TYPE_FILTER.ALL), "'All' option should be present");
            assert.isTrue(result[1].includes(csConst.ISSUE_LIST_TYPE_FILTER.ASSIGNED_TO_ME),
                "'Assigned to Me' option should be present");
            assert.isTrue(result[2].includes(csConst.ISSUE_LIST_TYPE_FILTER.CREATED_BY_ME), "'Created to Me' option should be present");
            assert.isTrue(result[3].includes(csConst.ISSUE_LIST_TYPE_FILTER.PUBLISH_REQUESTS),
                "'Publish requests' option should be present");
            assert.isTrue(result[4].includes(csConst.ISSUE_LIST_TYPE_FILTER.TASKS), "'Tasks' option should be present");
            assert.isTrue(result.length === 5, "5 options should be present");
        });

    it(`GIVEN Issue List dialog is opened WHEN Type Filter selector has been expanded AND 'Tasks' option clicked THEN selected option should be 'Tasks'`,
        async () => {
            let issueListDialog = new IssueListDialog();
            //1.Open Issue List dialog:
            await studioUtils.openIssuesListDialog();
            //2. Click on the dropdown handle and select 'Tasks' option:
            await issueListDialog.selectTypeFilterOption(csConst.ISSUE_LIST_TYPE_FILTER.TASKS);
            //3. Selected option should be "Tasks":
            studioUtils.saveScreenshot("issue_list_tasks_filtered");
            let result = await issueListDialog.getTypeFilterSelectedOption();
            assert.isTrue(result.includes(csConst.ISSUE_LIST_TYPE_FILTER.TASKS), "Tasks' option should be selected in 'Type Filter'");
        });

    it(`GIVEN Issue List dialog is opened WHEN Type Filter selector has been expanded THEN 'Assigned to Me' option should be disabled AND 'All' should be enabled`,
        async () => {
            let issueListDialog = new IssueListDialog();
            //1.Open Issue List dialog:
            await studioUtils.openIssuesListDialog();
            //2. Click on dropdown handle and expand 'Type Filter' selector:
            await issueListDialog.clickOnTypeFilterDropDownHandle();
            studioUtils.saveScreenshot("issue_list_assigned_to_me_disabled");
            //3. Wait for 'Assigned to Me' option should be disabled(no issue assigned to SU):
            await issueListDialog.waitForFilterOptionDisabled(csConst.ISSUE_LIST_TYPE_FILTER.ASSIGNED_TO_ME);
            //4. All option should not be disabled:
            let result = await issueListDialog.isFilterOptionDisabled("All");
            assert.isFalse(result, "All' option should not be disabled in 'Type Filter' selector");
        });

    it(`GIVEN Task Details dialog is opened WHEN task has been closed THEN number in Open/Closed buttons should be updated`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1.Open Issue List dialog:
            await studioUtils.openIssuesListDialog();
            let closedNumberBeforeClose = await issueListDialog.getNumberInClosedButton();
            let openNumberBeforeClose = await issueListDialog.getNumberInOpenButton();
            let filterInputNumberBeforeClose = await issueListDialog.getNumberInSelectedOption();
            //2. Click on the task, open Task Details dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //3. Close the task:
            await taskDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            await taskDetailsDialog.clickOnBackButton();
            await issueListDialog.pause(4000);
            let closedNumber = await issueListDialog.getNumberInClosedButton();

            //4. Number of closed and Open issues should be updated:
            await issueListDialog.isOpenButtonActive();
            let openNumber = await issueListDialog.getNumberInOpenButton();
            let filterInputNumber = await issueListDialog.getNumberInSelectedOption();
            //Number in 'All()' should be reduced, because 'Open' button is active:
            assert.equal(filterInputNumberBeforeClose - filterInputNumber, 1, "Number in TypeFilter should be reduced by 1");
            //Number of Open issues should be reduced:
            assert.equal(openNumberBeforeClose - openNumber , 1, "Number in 'Open' button should be reduced by 1");
            //Number of closed issues should be increased:
            assert.equal(closedNumber - closedNumberBeforeClose , 1, "Number of closed issues should be increased by 1");
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/1233
    it(`GIVEN Task Details dialog is opened WHEN task has been reopened THEN number in Open/Closed button should be updated`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1.Open 'Issue List' dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnClosedButton();
            let closedNumberBeforeReopen = await issueListDialog.getNumberInClosedButton();
            let openNumberBeforeReopen = await issueListDialog.getNumberInOpenButton();
            let filterInputNumberBeforeReopen = await issueListDialog.getNumberInSelectedOption();
            //2. Click on 'Closed' button, load Closed-issues then click on the closed task( open 'Task Details' dialog):
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //3. Click on 'Reopen Task' button and reopen the task:
            await taskDetailsDialog.clickOnReopenTaskButton();
            //4. Go to Issue List  dialog:
            await taskDetailsDialog.clickOnBackButton();
            await issueListDialog.pause(5000);
            let closedNumber = await issueListDialog.getNumberInClosedButton();
            //4. 'Closed()' button should be active:
            await issueListDialog.isClosedButtonActive();
            let openNumber = await issueListDialog.getNumberInOpenButton();
            let filterInputNumber = await issueListDialog.getNumberInSelectedOption();
            studioUtils.saveScreenshot("issue_list_number_in_all");
            //Number in 'All()' should be reduced, because 'Closed' button is active:
            //assert.equal((filterInputNumberBeforeReopen - filterInputNumber), 1, "number in 'All' should be reduced");
            //Number of Open issues should be increased:
            assert.equal(openNumber - openNumberBeforeReopen, 1, "Number of open-issues should be increased - 'Open()' button)");
            //Number of closed issues should be reduced:
            assert.equal(closedNumberBeforeReopen - closedNumber, 1, "Number of closed issues should be reduced- 'Closed()' button");
        });

    it(`GIVEN Issue List dialog is opened WHEN 'Tasks' option item has been selected THEN publish requests should not be displayed in the dialog`,
        async () => {
            let issueListDialog = new IssueListDialog();
            //1.Open 'Issue List' dialog:
            await studioUtils.openIssuesListDialog();
            //2. Select 'Tasks' in the filter:
            await issueListDialog.selectTypeFilterOption(csConst.ISSUE_LIST_TYPE_FILTER.TASKS);
            studioUtils.saveScreenshot("typefilter_tasks");
            //Publish request should not be present:
            await issueListDialog.waitForIssueNotPresent(PUBLISH_REQUEST_TITLE);
            // but the task should be present:
            await issueListDialog.waitForIssuePresent(TASK_TITLE);
        });

    it(`GIVEN Issue List dialog is opened WHEN 'Publish Requests' option item has been selected THEN existing task should not be displayed in the dialog`,
        async () => {
            let issueListDialog = new IssueListDialog();
            //1.Open 'Issue List' dialog:
            await studioUtils.openIssuesListDialog();
            //2. Select 'Publish Requests' in the filter:
            await issueListDialog.selectTypeFilterOption(csConst.ISSUE_LIST_TYPE_FILTER.PUBLISH_REQUESTS);
            await studioUtils.saveScreenshot("typefilter_requests");
            //Publish request should be present:
            await issueListDialog.waitForIssuePresent(PUBLISH_REQUEST_TITLE);
            // But the task should not be present:
            await issueListDialog.waitForIssueNotPresent(TASK_TITLE);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
