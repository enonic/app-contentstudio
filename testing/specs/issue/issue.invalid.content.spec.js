/**
 * Created on 13.07.2018.   updated on 15.07.2026
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
            await createIssueDialog.clickOnIncludeChildrenCheckbox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await createIssueDialog.clickOnIncludeChildrenCheckbox(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            // 4. click on 'create issue' button:
            await createIssueDialog.clickOnCreateIssueButton();
            // 5. Go to 'Items' tab
            await issueDetailsDialog.waitForDialogLoaded();
            await issueDetailsDialog.clickOnItemsTabItem()
            await studioUtils.saveScreenshot('issue_details_items_2_parent_selected');
            await issueDetailsDialog.pause(1000);
            // 6. Verify that 'All' checkbox is displayed in the dialog:
            await issueDetailsDialogItemsTab.waitForAllDependantsCheckboxDisplayed();
            // 7. Verify that expected number of items is displayed in the Items tab-link:
            let result = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(result, '25', "25 items should be displayed in the 'Items' link");
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
            await createIssueDialog.clickOnIncludeChildrenCheckbox(appConst.TEST_FOLDER_2_DISPLAY_NAME);
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

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
