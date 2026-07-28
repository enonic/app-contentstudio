/**
 * Created on 15.03.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');

describe('closed.issue.dependent.items.spec - tests for dependent items in closed issue', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const ISSUE_NAME = appConst.generateRandomName('issue');
    const TEST_FOLDER_NAME = appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME;
    const TEST_FOLDER_DISPLAY_NAME = appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME;

    // Verifies Dependencies in closed issues should not be excludable #6043
    // https://github.com/enonic/app-contentstudio/issues/6043
    it(`GIVEN 'Issue details' tab is loaded WHEN the issue has been closed THEN 'All' checkbox should be hidden`, async () => {
        let createIssueDialog = new CreateIssueDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        let issueDetailsDialog = new IssueDetailsDialog();
        let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
        // 1. folder with child items is selected:
        await studioUtils.findAndSelectItem(TEST_FOLDER_NAME);
        // 2. Expand Publish Menu and select 'Request Publishing...' menu item
        await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
        // 3. click on 'Include children items'
        await createIssueDialog.clickOnIncludeChildrenCheckbox(TEST_FOLDER_DISPLAY_NAME);
        await studioUtils.saveScreenshot('request_publish_include_children');
        // 4. Apply the staged selection:
        await createIssueDialog.clickOnApplySelectionButton();
        // 5. Fill in the name input then click on 'Create Issue' button
        await createIssueDialog.typeTitle(ISSUE_NAME);
        await createIssueDialog.clickOnCreateIssueButton();
        // 6. Go to 'Items' tab
        await issueDetailsDialog.waitForDialogLoaded();
        await issueDetailsDialog.clickOnItemsTabItem();
        // 7. Verify that 'All' checkbox is displayed
        //await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisplayed();
        // 8. Expand the status selector  then click on "Closed" menu item:
        await issueDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
        // 9. Verify that the dependants block gets disabled in the closed issue:
        await issueDetailsDialogItemsTab.waitForDependantItemsDisabled();
        // 10. Verify that 'All' checkbox is displayed but disabled:
        await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisplayed();
        await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisabled();
        // 11. Verify that all dependent items are displayed but disabled:
        let items = await issueDetailsDialogItemsTab.getDisplayNameInDisabledDependantItems();
        assert.equal(items.length, 10, '10 disabled dependent items should be displayed in the closed issue');
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
