/**
 * Created on 13.07.2018.
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

describe('issue.invalid.content.spec: create a issue with invalid content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let ISSUE_TITLE_2 = appConst.generateRandomName('issue');
    let ISSUE_TITLE = appConst.generateRandomName('issue');
    const TEST_CONTENT_NAME = 'circles';

    // Verifies https://github.com/enonic/app-contentstudio/issues/5679
    // Issues lose "Include child items" flag on save #5679
    it("GIVEN Create Issue dialog is opened with 2 parent folders WHEN 'Include children' icons have been clicked AND 'Create Issue' button has been pressed THEN all child items should be included in the 'Items' tab",
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Select checkboxes for 2 existing folder with child items:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            await contentBrowsePanel.waitForPublishButtonVisible();
            // 2. open 'Create Issue' dialog:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE_2);
            // 3. Click on both 'include children items' icons:
            await createIssueDialog.clickOnIncludeChildrenToggler(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await createIssueDialog.clickOnIncludeChildrenToggler(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            // 4. click on 'create issue' button:
            await createIssueDialog.clickOnCreateIssueButton();
            // 5. Go to 'Items' tab
            await issueDetailsDialog.waitForDialogLoaded();
            await issueDetailsDialog.clickOnItemsTabBarItem()
            await studioUtils.saveScreenshot('issue_details_items_2_parent_selected');
            await issueDetailsDialog.pause(1000);
            // 6. Verify that 'All' checkbox is displayed in the dialog:
            await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisplayed();
            // 7. Verify that expected number of items is displayed in the Items tab-link:
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '25', "25 items should be displayed in the 'Items' link");
            // 8. Publish button should be enabled, because all items are valid
            await issueDetailsDialogItemsTab.waitForPublishButtonEnabled();
            // 9. Verify that both togglers are 'switched on' in the Items tab
            await issueDetailsDialogItemsTab.waitForIncludeChildrenIsOn(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await issueDetailsDialogItemsTab.waitForIncludeChildrenIsOn(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
        });

    it(`GIVEN existing folder with one invalid child item is selected WHEN 'Create Issue' menu item has been selected and issue created THEN '10' number should be in 'Items' on IssueDetailsDialog`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the existing folder with child items:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_2_NAME);
            await contentBrowsePanel.waitForPublishButtonVisible();
            // 2. open 'Create Issue' dialog
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnIncludeChildrenToggler(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            await studioUtils.saveScreenshot('create_issue_dialog_1');
            // 3. click on create issue button:
            await createIssueDialog.clickOnCreateIssueButton();
            await studioUtils.saveScreenshot('issue_details_should_be_loaded');
            await issueDetailsDialog.waitForDialogLoaded();
            await issueDetailsDialog.pause(1000);
            // 4. 12 items should be in the issue-details dialog:
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '12', "12 items should be displayed in the 'Items' link");
        });

    it(`GIVEN issue with not valid item is clicked WHEN Items-tab has been clicked THEN 'Publish & Close Issue' button should be disabled, because invalid child is present`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Open Issues List Dialog:
            await studioUtils.openIssuesListDialog();
            // 2. Click on the issue and open Issue Details dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 3. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            await studioUtils.saveScreenshot('publish_close_issue_should_be_disabled');
            // 4.'Publish...' button should be disabled, because invalid child is present'
            let isEnabled = await issueDetailsDialogItemsTab.isPublishButtonEnabled();
            assert.ok(isEnabled === false, 'Publish & Close button should be disabled(invalid child)');
        });

    it(`GIVEN Items-tab has been clicked WHEN invalid content has been excluded THEN 'Publish...' button gets enabled`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            // 2. Click on the issue and open Issue Details dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 3. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 4. Exclude the invalid content:
            await issueDetailsDialogItemsTab.clickOnCheckboxInDependentItem('shortcut-imported');
            await issueDetailsDialogItemsTab.clickOnApplySelectionButton();
            await issueDetailsDialogItemsTab.waitForNotificationMessage();
            // 5.'Publish...' button gets enabled, because invalid child is excluded'
            await issueDetailsDialogItemsTab.waitForPublishButtonEnabled();
            // 6. Verify that 'Hide excluded' button gets visible:
            await issueDetailsDialogItemsTab.waitForHideExcludedItemsButtonDisplayed();
            await studioUtils.saveScreenshot('issue_invalid_dependent_excluded');
            let isSelected = await issueDetailsDialogItemsTab.isDependantCheckboxSelected('shortcut-imported');
            assert.ok(isSelected === false, 'Checkbox for excluded invalid-item should not be selected');
        });

    it(`GIVEN dependant item has been excluded in Create Issue dialog WHEN 'Publish...' button has been clicked and Publish Wizard is loaded THEN items with unselected checkbox should not be present in Publish wizard`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Open Issues Details dialog dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Go to 'Items' tab(IssueDetails dialog):
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Exclude a dependant item: click on the checkbox:
            await issueDetailsDialogItemsTab.clickOnCheckboxInDependentItem(TEST_CONTENT_NAME);
            await issueDetailsDialogItemsTab.clickOnApplySelectionButton();
            await issueDetailsDialogItemsTab.waitForNotificationMessage();
            await studioUtils.saveScreenshot('publish_wizard_content_excluded_0');
            // 4. Click on 'Publish' button in the 'Issue Details' dialog, 'Publish Wizard' should be loaded:
            let contentPublishDialog = await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            await studioUtils.saveScreenshot('publish_wizard_content_excluded_1');
            // 5. Verify that excluded dependant item is  present in the list in 'Content Publish' dialog:
            let result = await contentPublishDialog.getDisplayNameInDependentItems();
            // returns a truthy value for at least one element in the array contains the name. Otherwise, false.
            let isPresent = result.some(el => el.includes(TEST_CONTENT_NAME));
            assert.ok(isPresent, 'Unselected content should  be present in dependency block in Publishing Wizard');
            // 6. The checkbox should be unselected
            let isSelected = await issueDetailsDialogItemsTab.isDependantCheckboxSelected(TEST_CONTENT_NAME);
            assert.ok(isSelected === false, 'CheckBox for the excluded item should be unselected');
            // 7. Hide excluded button should be visible:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
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
