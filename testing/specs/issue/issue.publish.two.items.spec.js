/**
 * Created on 10.07.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');

describe('issue.publish.two.items.spec: 2 folders have been added and published', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let ISSUE_TITLE = appConst.generateRandomName('issue');
    let folder1;
    let folder2;
    it(`Precondition: two work in progress folder should be added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            // do add the first folder:
            await studioUtils.doAddFolder(folder1);
            // add the second folder:
            await studioUtils.doAddFolder(folder2);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/2825
    // Default action is not updated after several content items have been marked as ready in the filtered grid
    it(`GIVEN two folders are selected WHEN new issue has been created THEN items tab on 'Issue Details Dialog' should be loaded with expected data`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select 2 folders then do 'Mark as Ready':
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await contentBrowsePanel.pause(500);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButtonAndConfirm();
            // Publish wizard should be loaded automatically:
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // Verify that 'Publish' button is default action now:
            await contentBrowsePanel.waitForPublishButtonVisible();
            // 2. Open 'Create Issue' dialog and create new task:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnCreateIssueButton();
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // 3. Verify the items to publish:
            let result = await issueDetailsDialogItemsTab.getItemDisplayNames();
            assert.ok(result.includes(folder1.displayName));
            assert.ok(result.includes(folder2.displayName));
            let actualNumber = await issueDetailsDialog.getNumberInItemsTab();
            assert.equal(actualNumber, '2', '2 items to publish should be present in the dialog');
            let status = await issueDetailsDialogItemsTab.getContentStatus(folder1.displayName)
            assert.equal(status, 'New', 'New content-status should be displayed in the dialog');
        });

    it(`GIVEN 'Issue Details Dialog' is opened AND Items-tab activated WHEN 'Publish...' button has been pressed THEN 2 content should be published and the task gets closed`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            await studioUtils.openIssuesListDialog();
            // 1. Open Issue Details Dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Go to Items tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            // Click on Publish... button and open Publishing Wizard
            await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 3. Click on Publish Now button :
            await contentPublishDialog.clickOnPublishNowButton();
            let message = await issueDetailsDialog.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.TWO_ITEMS_PUBLISHED, "'2 items are published' message should be displayed");
            let expectedMessage = appConst.NOTIFICATION_MESSAGES.ISSUE_CLOSED_MESSAGE;
            await issueDetailsDialog.waitForExpectedNotificationMessage(expectedMessage);
        });

    it(`WHEN two items has been selected THEN Preview dropdown should be visible in its toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select checkboxes:
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            await contentItemPreviewPanel.pause(1000);
            await studioUtils.saveScreenshot('two_items_selected_preview_toolbar');
            // 2. 'Preview dropdown should be visible, because the task is closed'
            await contentItemPreviewPanel.waitForPreviewWidgetDropdownDisplayed();
        });

    it(`GIVEN two published items are selected WHEN 'Unpublish' dialog has been opened and 'Unpublish(2)' button pressed THEN confirm value dialog should appear`,
        async () => {
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. Select 2 published folders:
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            let contentBrowsePanel = new ContentBrowsePanel();
            // 2. Open Unpublish dialog:
            let unpublishDialog = await contentBrowsePanel.clickOnUnpublishButton();
            // 3. Open Confirm value dialog:
            await unpublishDialog.clickOnUnpublishButton();
            await confirmValueDialog.waitForDialogOpened();
            // 4. Type the required number of unpublished content then click on Confirm button:
            await confirmValueDialog.typeNumberOrName(2);
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
            let message = await contentBrowsePanel.waitForNotificationMessage();
            // 5. Verify the notification message:
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.TWO_ITEMS_UNPUBLISHED, '2 items are unpublished - is expected message');
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
