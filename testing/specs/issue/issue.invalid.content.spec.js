/**
 * Created on 13.07.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('issue.not.valid.content.spec: create a issue with invalid content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let ISSUE_TITLE = appConst.generateRandomName('issue');
    const TEST_CONTENT_NAME = "circles";

    it(`GIVEN existing folder with one not valid child is selected WHEN 'Create Issue' menu item has been selected and issue created THEN '10' number should be in 'Items' on IssueDetailsDialog`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the existing folder with children:
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
            await issueDetailsDialog.waitForDialogOpened();
            await issueDetailsDialog.pause(1000);
            // 4. 12 items should be in the issue-details dialog:
            let result = await issueDetailsDialog.getNumberOfItems();
            assert.equal(result, '12', '12 items should be displayed in the `Items`link');
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
            await issueDetailsDialog.waitForDialogOpened();
            // 3. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            await studioUtils.saveScreenshot("publish_close_issue_should_be_disabled");
            // 4.'Publish...' button should be disabled, because invalid child is present'
            let result = await issueDetailsDialogItemsTab.isPublishButtonEnabled();
            assert.isFalse(result, 'Publish & Close button should be disabled(invalid child)');
        });

    it(`GIVEN Items-tab has been clicked WHEN not valid content has been excluded THEN 'Publish...' button is getting enabled`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            //1. Open Issues List dialog:
            await studioUtils.openIssuesListDialog();
            //2. Click on the issue and open Issue Details dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogOpened();
            //3. Go to 'Items' tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            //4. Exclude the not valid content:
            await issueDetailsDialogItemsTab.excludeDependantItem('shortcut-imported');
            await issueDetailsDialogItemsTab.waitForNotificationMessage();
            //5.'Publish...' button gets enabled, because invalid child is excluded'
            await issueDetailsDialogItemsTab.waitForPublishButtonEnabled();
        });

    // Verifies: Items that were removed in Issue Details items appear again in Publish Wizard dialog #783
    it(`GIVEN dependant item has been excluded WHEN 'Publish...' button has been clicked and Publish Wizard is loaded THEN excluded item should not be present in the wizard`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            //1. Open Issues Details dialog dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogOpened();
            //2. Go to 'Items' tab(IssueDetails dialog):
            await issueDetailsDialog.clickOnItemsTabBarItem();
            //3. Exclude a dependant item:
            await issueDetailsDialogItemsTab.clickOnShowDependentItems();
            await issueDetailsDialogItemsTab.excludeDependantItem(TEST_CONTENT_NAME);
            //5. Click on Publish button, 'Publish Wizard' should be loaded:
            let contentPublishDialog = await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            await contentPublishDialog.clickOnShowDependentItems();
            //6. Verify that removed dependant item is not present in the list in Content Publish dialog:
            let result = await contentPublishDialog.getDisplayNameInDependentItems();
            //returns a truthy value for at least one element in the array contains the name. Otherwise, false.
            let isPresent = result.some(el => el.includes(TEST_CONTENT_NAME));
            assert.isFalse(isPresent, "removed content should not be present in Publishing Wizard");
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
