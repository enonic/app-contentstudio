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

describe(`issue.list.type.filter.spec: tests 'Type Filter' in Issues List modal dialog`, function () {
    this.timeout(csConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = csConst.generateRandomName('task');
    let TEST_FOLDER;

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
            await createTaskDialog.typeTitle(issueTitle);
            //2. Create new task:
            await createTaskDialog.clickOnCreateTaskButton();
            await taskDetailsDialog.waitForDialogOpened();
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
            studioUtils.saveScreenshot("issue_list_tasks_filtered")
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

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
