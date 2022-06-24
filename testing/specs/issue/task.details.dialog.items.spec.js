/**
 * Created on 13.04.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateTaskDialog = require('../../page_objects/issue/create.task.dialog');
const TaskDetailsDialog = require('../../page_objects/issue/task.details.dialog');
const TaskDetailsDialogItemsTab = require('../../page_objects/issue/task.details.items.tab');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('task.details.dialog.items.spec: open task details dialog and check control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let TASK_TITLE = appConst.generateRandomName('task');

    it(`GIVEN existing folder with images is selected WHEN 'Create Task' menu item has been selected and issue created THEN '1' should be in 'Items' tab link`,
        async () => {
            let createTaskDialog = new CreateTaskDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let taskDetailsDialog = new TaskDetailsDialog();
            //1. Select the folder:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            // Publish button is getting visible, because the content is 'New' and valid
            await contentBrowsePanel.waitForPublishButtonVisible();
            //2. open 'Create Task' dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateTask();
            await createTaskDialog.typeTitle(TASK_TITLE);
            //3. Click on 'Create Task' button(new task is created):
            await createTaskDialog.clickOnCreateTaskButton();
            //4. Task Details dialog should be loaded:
            await taskDetailsDialog.waitForDialogOpened();
            let result = await taskDetailsDialog.getNumberOfItems();
            assert.equal(result, '1', '1 should be present in the `Items` tab link');
        });

    it(`GIVEN Task Details Dialog is opened WHEN Items-tab has been clicked THEN 'Publish...' button and Content Combobox should be displayed`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            //1. Open Issue List dialog:
            await studioUtils.openIssuesListDialog();
            //2. Click on the task and open Task Details dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //3. Click on 'Items' tab bar item:
            await taskDetailsDialog.clickOnItemsTabBarItem();

            let isActive = await taskDetailsDialog.isItemsTabBarItemActive();
            assert.isTrue(isActive, "Items tab gets active");
            //4. Content option filter input should be present:
            await taskDetailsDialogItemsTab.waitForContentOptionsFilterInputDisplayed();
            let result = await taskDetailsDialogItemsTab.isPublishButtonDisplayed();
            assert.isTrue(result, "'Publish...' button should be displayed");
        });

    it(`GIVEN Items-tab has been clicked WHEN 'Include Child Items' icon has been clicked THEN 'Show dependent items' link should appear`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            //1. Click on the task and open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Click on Items tab bar item
            await taskDetailsDialog.clickOnItemsTabBarItem();
            //3. Click on 'Include Child' icon:
            await taskDetailsDialogItemsTab.clickOnIncludeChildItems(appConst.TEST_FOLDER_WITH_IMAGES);
            //4. waits for Show Dependent Items link:
            await taskDetailsDialogItemsTab.waitForShowDependentItemsLinkDisplayed();
            let result = await taskDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '13', 'Number of items should be updated to 13');
            let numberInShowDepItemsLink = await taskDetailsDialogItemsTab.getNumberInDependentItemsLink();
            assert.equal(numberInShowDepItemsLink, '12', "Expected number should be present in the 'Show Dependent Items'-link")
        });

    it(`GIVEN existing task (child items were included) WHEN task details is opened THEN 'Show dependent items' link should be present`,
        async () => {
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            let taskDetailsDialog = new TaskDetailsDialog();
            let issueListDialog = new IssueListDialog();
            //1. Open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Click on Items tab
            await taskDetailsDialog.clickOnItemsTabBarItem();
            //'`Show dependent items` link should be displayed'
            await taskDetailsDialogItemsTab.waitForShowDependentItemsLinkDisplayed();
            let result = await taskDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '13', 'Expected number of items should be displayed');
        });

    it(`GIVEN existing task (child items were included) WHEN task details is opened  AND 'Show Dependent items' link has been clicked THEN 'hide dependent items' link should appear`,
        async () => {
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            let taskDetailsDialog = new TaskDetailsDialog();
            let issueListDialog = new IssueListDialog();
            //1. Open task details dialog(dependent items are included)
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Go to 'Items' tab:
            await taskDetailsDialog.clickOnItemsTabBarItem();
            //3. Click on 'Show Dependent Items' toggler:
            await taskDetailsDialogItemsTab.clickOnShowDependentItems();
            // 'Hide dependent items' link gets visible now
            await taskDetailsDialogItemsTab.waitForHideDependentItemsLinkDisplayed();
        });

    it(`GIVEN existing task (child items are included) WHEN task details is opened  AND 'Exclude child items' icon has been clicked THEN number of items to publish should be decreased `,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            let issueListDialog = new IssueListDialog();
            //1. Open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Go to 'Items' tab:
            await taskDetailsDialog.clickOnItemsTabBarItem();
            //3. Exclude children(click on the toggler):
            await taskDetailsDialogItemsTab.clickOnIncludeChildrenToggler(appConst.TEST_FOLDER_WITH_IMAGES);
            let result = await taskDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '1', 'only one item should be present in the link');
        });

    //Verifies: Task Details Dialog switches to the Comments tab after save #1571
    it(`GIVEN existing task is opened in Details Dialog WHEN new item has been added THEN 'Items' tab remains active`,
        async () => {
            let taskDetailsDialog = new TaskDetailsDialog();
            let taskDetailsDialogItemsTab = new TaskDetailsDialogItemsTab();
            let issueListDialog = new IssueListDialog();
            //1. Open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await taskDetailsDialog.waitForDialogOpened();
            //2. Go to 'Items' tab:
            await taskDetailsDialog.clickOnItemsTabBarItem();
            //3. Add one more item:
            await taskDetailsDialogItemsTab.addItem("cape");
            //4. Verify that Items tab remains active:
            await taskDetailsDialogItemsTab.pause(2000);
            let isActive = await taskDetailsDialog.isItemsTabBarItemActive();
            assert.isTrue(isActive, "Items Tab should remain active after adding a item");
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