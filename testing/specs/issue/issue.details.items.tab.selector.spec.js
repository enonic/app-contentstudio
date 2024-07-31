/**
 * Created on 28.03.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');

describe('issue.details.items.tab.selector.spec: tests for items combobox', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let ISSUE_TITLE = appConst.generateRandomName('issue');
    let folder1;
    let folder2;
    it(`Precondition: two ready for publishing folders should be added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            // add the first folder:
            await studioUtils.doAddReadyFolder(folder1);
            // add the second folder:
            await studioUtils.doAddReadyFolder(folder2);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/733
    // Duplicated items in Issue Details Dialog #733
    it(`GIVEN Issue Details Items tab with 2 items is opened WHEN dropdown has been expanded and one of the checkboxes has been unselected THEN single selected options should be displayed in the dialog`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            // 1. Select 2 folders:
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await contentBrowsePanel.pause(500);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            // 2. Open 'Create Issue' dialog and create new issue:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnCreateIssueButton();
            await createIssueDialog.waitForNotificationMessage();
            // 3. Go to Items Tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 4. Expand the dropdown:
            await issueDetailsDialogItemsTab.clickOnDropdownHandle();
            // 5. Unselect one option:
            await issueDetailsDialogItemsTab.clickOnCheckboxInDropdown(1);
            // 6. Click on Apply button in the combobox:
            await issueDetailsDialogItemsTab.clickOnApplyButtonInCombobox();
            await studioUtils.saveScreenshot('issue_items_tab_checkbox_unselected');
            let itemsToPublish = await issueDetailsDialogItemsTab.getItemDisplayNames();
            // 7. Verify that one selected option remains visible after unselecting the checkbox in the dropdown:
            assert.equal(itemsToPublish.length, 1, 'One item should be present in the selected options form');
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
