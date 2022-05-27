/**
 * Created on 07.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const IssueDetailsDialogAssigneesTab = require('../../page_objects/issue/issue.details.dialog.assignees.tab');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const PropertiesWidget = require('../../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');

describe('close.task.by.user.spec: create a task for user and close it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const TASK_TITLE = appConst.generateRandomName("task");

    it(`Precondition 1: new system user should be added`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new system user:
            await studioUtils.navigateToUsersApp();
            let userName = contentBuilder.generateRandomName("user");
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE, appConst.SYSTEM_ROLES.CM_APP, appConst.SYSTEM_ROLES.CM_ADMIN];
            USER = contentBuilder.buildUser(userName, PASSWORD, contentBuilder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`GIVEN SU selects a folder and opens 'Create Task...' dialog WHEN new task has been assigned to the just created user THEN new task should be loaded in IssueDetailsDialog`,
        async () => {
            await studioUtils.navigateToContentStudioApp()
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            //2. Select the folder and open Create Task dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(TASK_TITLE);
            //3. Assign the task to the just created user:
            await createTaskDialog.selectUserInAssignees(USER.displayName);
            await studioUtils.saveScreenshot("task_assigned");
            //4. Click on 'Create Task' button and create new task:
            await createTaskDialog.clickOnCreateTaskButton();
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, appConst.TASK_CREATED_MESSAGE);
            await taskDetailsDialog.waitForDialogOpened();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("WHEN the user is logged in THEN 'Assigned to Me' button should be displayed in the browse toolbar",
        async () => {
            //1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let issueListDialog = new IssueListDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.saveScreenshot("assigned_to_me_label");
            //Verify that 'Assigned to Me' label is displayed in the Open Issues button
            await contentBrowsePanel.waitForAssignedToMeButtonDisplayed();
            //2. Open 'Issues List' dialog:
            await studioUtils.openIssuesListDialog();
            //3. Verify the selected option in the selector:
            let result = await issueListDialog.getTypeFilterSelectedOption();
            assert.include(result, 'Assigned to Me', "'Assigned to Me' options should be selected in the filter");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN the user is logged in WHEN the user closed his task THEN the issue should be 'Closed' in the issue details dialog",
        async () => {
            //1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let issueListDialog = new IssueListDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            //2. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            //3. Click on the task and load Task Details Dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //4. Expand the status selector
            await taskDetailsDialog.clickOnStatusSelectorMenu();
            //5. Click on "Closed" menu item:
            await taskDetailsDialog.clickOncloseTabMenuItem();
            await studioUtils.saveScreenshot("task_closed");
            //6. Verify that the notification message appears:
            await taskDetailsDialog.waitForNotificationMessage();
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it(`GIVEN SU is logged in WHEN the task,just closed by the user has been loaded in task details dialog THEN 'closed by' info should be present`,
        async () => {
            //1. SU is logged in:
            await studioUtils.navigateToContentStudioApp()
            let taskDetailsDialog = new TaskDetailsDialog();
            let issueListDialog = new IssueListDialog();
            //2. SU opens 'Issues List' dialog:
            await studioUtils.openIssuesListDialog();
            //3. Open 'Closed' issues tab:
            await issueListDialog.clickOnClosedButton();
            //4. Click on the task:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            //5. Verify the status info:
            let info = await taskDetailsDialog.getStatusInfo();
            let expectedMessage = appConst.issueClosedBy(USER.displayName);
            //6. Verify that the info message is displayed in the status selector : "Closed by user:system:${userName}"
            assert.isTrue(info.includes(expectedMessage), "Expected notification message should appear");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN the user has selected the folder WHEN the folder has been duplicated THEN expected owner should be displayed for this folder in Properties Widget",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let propertiesWidget = new PropertiesWidget();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. user is logged in:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            //2. Select and duplicate the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let contentDuplicateModalDialog = await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateModalDialog.clickOnDuplicateButton();
            await contentDuplicateModalDialog.waitForDialogClosed();
            //3. Select the copy :
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName + "-copy");
            await studioUtils.saveScreenshot("owner_copy_folder");
            //4. Verify the owner name in the properties widget:
            let owner = await propertiesWidget.getOwnerName();
            assert.equal(owner, USER.displayName, "Expected user should be displayed in the widget");
            //5. Open Versions widget:
            await contentBrowseDetailsPanel.openVersionHistory();
            //4. Click on the 'Created' item in versions widget:
            await browseVersionsWidget.clickAndExpandVersionByName("Created");
            await studioUtils.saveScreenshot("owner_in_versions");
            //5. Verify the owner name in the version item:
            let ownerNameInVersions = await browseVersionsWidget.getOwnerName();
            assert.isTrue(ownerNameInVersions.includes(USER.displayName));
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
