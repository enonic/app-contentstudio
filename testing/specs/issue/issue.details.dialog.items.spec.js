/**
 * Created on 13.04.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('issue.details.dialog.items.spec: open issue details dialog and check control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TASK_TITLE = appConst.generateRandomName('task');
    const EXPECTED_LABEL_CHECKBOX = 'All (13)';

    it(`GIVEN existing folder with images is selected WHEN 'Create Task' menu item has been selected and issue created THEN '1' should be in 'Items' tab link`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            // Publish button is getting visible, because the content is 'New' and valid
            await contentBrowsePanel.waitForPublishButtonVisible();
            // 2. open 'Create Task' dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(TASK_TITLE);
            // 3. Click on 'Create Issue' button(new task is created):
            await createIssueDialog.clickOnCreateIssueButton();
            // 4. Task Details dialog should be loaded:
            await issueDetailsDialog.waitForDialogLoaded();
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '1', '1 should be present in the `Items` tab link');
        });

    it(`GIVEN Task Details Dialog is opened WHEN Items-tab has been clicked THEN 'Publish...' button and Content Combobox should be displayed`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Open Issue List dialog:
            await studioUtils.openIssuesListDialog();
            // 2. Click on the task and open Task Details dialog:
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 3. Click on 'Items' tab bar item:
            await issueDetailsDialog.clickOnItemsTabBarItem();

            let isActive = await issueDetailsDialog.isItemsTabBarItemActive();
            assert.ok(isActive, "Items tab gets active");
            // 4. Content(Items) option filter input should be displayed:
            await issueDetailsDialogItemsTab.waitForItemsOptionsFilterInputDisplayed();
            let result = await issueDetailsDialogItemsTab.isPublishButtonDisplayed();
            assert.ok(result, "'Publish...' button should be displayed");
        });

    it(`GIVEN Items-tab has been clicked WHEN 'Include Child Items' icon has been clicked THEN List of items should be expanded AND 'All' dependant checkbox should appear`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Click on the task and open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Click on Items tab bar item
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Click on 'Include Child' icon:
            await issueDetailsDialogItemsTab.clickOnIncludeChildItems(appConst.TEST_FOLDER_WITH_IMAGES);
            let message = await issueDetailsDialogItemsTab.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.ISSUE_UPDATED_MESSAGE,'The issue has been updated. - should appear');
            await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisplayed();
            let isSelected = await issueDetailsDialogItemsTab.isAllDependantsCheckboxSelected();
            assert.ok(isSelected, "'All' checkbox should be selected");
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '14', 'Number of items should be updated to 14');
            let numberInHideDepItemsLink = await issueDetailsDialogItemsTab.getNumberInAllCheckbox();
            assert.equal(numberInHideDepItemsLink, EXPECTED_LABEL_CHECKBOX, "Expected number should be present in the 'All'-checkbox")
        });

    it(`GIVEN existing task (child items were included) WHEN task details is opened THEN 'All' dependant checkbox should be present`,
        async () => {
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            // 1. Open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Click on Items tab
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // `All` link should be displayed
            await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisplayed();
            let label = await issueDetailsDialogItemsTab.getNumberInAllCheckbox();
            assert.equal(label, EXPECTED_LABEL_CHECKBOX, '13 should be displayed in the checkbox');
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '14', 'Expected number of items should be displayed');
        });

    it(`GIVEN task details is opened WHEN 'All' checkbox has been unselected THEN 'Apply' selection button should appear`,
        async () => {
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            // 1. Open task details dialog(dependent items are included)
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Unselect  'All' checkbox
            await issueDetailsDialogItemsTab.clickOnAllCheckbox();
            // 4. Verify that 'Apply' button gets visible:
            await issueDetailsDialogItemsTab.waitForApplySelectionButtonDisplayed();
            // 5. Verify that 'Publish' button gets disabled:
            await issueDetailsDialogItemsTab.waitForPublishButtonDisabled();
        });

    it(`GIVEN task details is opened WHEN 'Exclude child items' icon has been clicked THEN number of items to publish should be 1`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueListDialog = new IssueListDialog();
            // 1. Open Task Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Exclude children(click on the toggler):
            await issueDetailsDialogItemsTab.clickOnIncludeChildrenToggler(appConst.TEST_FOLDER_WITH_IMAGES);
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '1', 'only one item should be present in the link');
        });

    // Verifies: Task Details Dialog switches to the Comments tab after save #1571
    it(`GIVEN existing task is opened in Details Dialog WHEN new item has been added THEN 'Items' tab remains active`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueListDialog = new IssueListDialog();
            // 1. Open Issue Details dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(TASK_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Add one more item in the content combobox and click on 'Apply' button:
            await issueDetailsDialogItemsTab.filterAndSelectItem(appConst.TEST_IMAGES.CAPE);
            // 4. Verify that Items tab remains active:
            await issueDetailsDialogItemsTab.pause(2000);
            let isActive = await issueDetailsDialog.isItemsTabBarItemActive();
            assert.ok(isActive, 'Items Tab should remain active after adding a item');
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
