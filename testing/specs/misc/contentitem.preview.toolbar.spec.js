/**
 * Created on 21.06.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CompareWithPublishedVersionDialog = require('../../page_objects/compare.with.published.version.dialog');

describe('contentItem.preview.toolbar.spec: create an issue and check it in the preview toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let firstIssueTitle = appConst.generateRandomName('issue');
    let secondIssueTitle = appConst.generateRandomName('issue');
    let TEST_FOLDER;

    it(`GIVEN folder has been created WHEN the folder is selected THEN 'New' status should be displayed in the preview-toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Add new folder and select it:
            await studioUtils.doAddFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.saveScreenshot('content_item_toolbar');
            // 2.Verify that 'New' status is displayed in Item Preview toolbar:
            let status = await contentItemPreviewPanel.getContentStatus();
            assert.equal(status, 'New', "'New' status should be displayed in the Preview Item toolbar");
            // Author should not be displayed in the toolbar:
            await contentItemPreviewPanel.waitForAuthorNotDisplayed();
        });

    // verifies "https://github.com/enonic/app-contentstudio/issues/190"
    // Preview Panel - status should not be visible when no content is selected
    it(`GIVEN existing folder is selected WHEN the folder has been unselected THEN preview toolbar gets not visible`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            let contentBrowsePanel = new ContentBrowsePanel();
            // 2. Unselect this folder:
            await contentBrowsePanel.clickOnRowByName(TEST_FOLDER.displayName);
            // content-status on the Preview Toolbar should be cleared
            await contentItemPreviewPanel.waitForStatusCleared();
            // content-author in the Preview Toolbar should be cleared:
            await contentItemPreviewPanel.waitForAuthorCleared();
        });

    it(`GIVEN existing 'New' folder WHEN the folder is selected and published THEN 'Published' status should be displayed in the preview toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the folder
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Click on 'Mark on ready' button in the browse toolbar:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            // 3. Verify that Publish wizard is loaded
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            // 3. Published status should be displayed in the item preview toolbar:
            let status = await contentItemPreviewPanel.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED, "The folder should be 'Published'");
            await contentItemPreviewPanel.waitForAuthorNotDisplayed();
        });

    it(`GIVEN existing 'published' folder is selected WHEN the first task has been created THEN menu button with the task-name should appear in the ItemPreviewToolbar`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 1. open 'Create Issue' dialog and create the first task:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(firstIssueTitle);
            await createIssueDialog.clickOnCreateIssueButton();
            // 2. Close the modal dialog
            await issueDetailsDialog.clickOnCancelTopButton();
            let issueName = await contentItemPreviewPanel.getIssueNameInMenuButton();
            assert.equal(issueName, firstIssueTitle, "The task-name should be appear in the item preview toolbar");
        });

    it(`GIVEN existing 'published' folder is selected WHEN the second task has been created THEN task-name should be updated in the menu button(ItemPreviewToolbar)`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let createIssueDialog = new CreateIssueDialog();
            // 1. Select the content,expand tasks-menu and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.openPublishMenuAndClickOnCreateIssue();
            // 2. Create new issue:
            await createIssueDialog.typeTitle(secondIssueTitle);
            await createIssueDialog.clickOnCreateIssueButton();
            // 3. Close the modal dialog
            await issueDetailsDialog.clickOnCancelTopButton();
            // 'Tasks-dropdown handle' should appear in the preview toolbar(the second issue is created)
            await contentItemPreviewPanel.waitForIssueDropDownHandleDisplayed();
            // Issue name should be updated in the preview panel:
            return contentItemPreviewPanel.waitForIssueNameInMenuButton(secondIssueTitle);
        });

    it(`GIVEN existing folder is selected WHEN task-menu button has been clicked THEN 'Task Details' modal dialog should appear`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the content,expand tasks-menu and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Verify that issue-button gets visible in the 'Content Item Preview Toolbar' then click on the button:
            await contentItemPreviewPanel.clickOnIssueMenuButton();
            await issueDetailsDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('task_menu_button_clicked');
            let title = await issueDetailsDialog.getIssueTitle();
            assert.equal(title, secondIssueTitle, 'required task-name should be loaded in the modal dialog');
        });

    it(`GIVEN existing folder with 2 tasks is selected AND dropdown in the issue-menu has been clicked WHEN click on the menu-item in the dropdown list THEN 'Task Details' modal dialog should appear with correct tittle`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the content,expand tasks-menu and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentItemPreviewPanel.clickOnIssueMenuDropDownHandle();
            await contentItemPreviewPanel.clickOnIssueMenuItem(firstIssueTitle);
            await issueDetailsDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('task_menu_item_clicked');
            let title = await issueDetailsDialog.getIssueTitle();
            assert.equal(title, firstIssueTitle, 'required task-name should be loaded in the modal dialog');
        });

    // verifies  https://github.com/enonic/app-contentstudio/issues/721
    // dropdown handle for issues remains after the content is unselected
    it(`GIVEN existing folder with 2 tasks is selected WHEN this folder has been unselected THEN 'tasks drop down handle' gets not visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. select the folder with 2 issues:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Dropdown handle for issues should be displayed on the Preview Panel:
            await contentItemPreviewPanel.waitForIssueDropDownHandleDisplayed();
            // 3. unselect the folder:
            await contentBrowsePanel.clickOnRowByDisplayName(TEST_FOLDER.displayName);
            // 4. Dropdown handle for issues gets not visible(exception will be thrown after the timeout)
            await contentItemPreviewPanel.waitForIssueDropDownHandleNotDisplayed();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/261. ContentItemPreviewToolbar - issues are not refreshed on the toolbar
    it(`GIVEN folder(2 tasks) was selected and 'IssueDetails' dialog is opened WHEN the task has been closed THEN task-name should be updated in the task-menu(Preview toolbar)`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            // 1. Select the folder and open Task Details dialog:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentItemPreviewPanel.clickOnIssueMenuButton();
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Close the issue:
            await issueDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            // 3. Close the modal dialog:
            await issueDetailsDialog.clickOnCancelTopButton();
            await studioUtils.saveScreenshot('issue_menu_button_updated');
            // 4. issue name should be updated in tne preview panel:
            await contentItemPreviewPanel.waitForIssueNameInMenuButton(firstIssueTitle);
        });

    it(`WHEN published folder has been modified THEN 'Show changes' button should appear in the item preview toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentWizard = new ContentWizard();
            let compareWithPublishedVersionDialog = new CompareWithPublishedVersionDialog();
            // 1. Open and update the published folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.typeDisplayName(appConst.generateRandomName('test'));
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            await studioUtils.saveScreenshot('show_changes_button_browse_panel');
            // 2. Verify that 'Show Changes' button gets visible in the preview toolbar:
            await contentItemPreviewPanel.waitForShowChangesButtonDisplayed();
            let status = await contentItemPreviewPanel.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.MODIFIED, 'content status should be Modified');
            // 3.  Open 'Compare With Published Version' modal dialog
            await contentItemPreviewPanel.clickOnShowChangesToolbarButton();
            await compareWithPublishedVersionDialog.waitForDialogOpened();
        });

    it(`WHEN modified folder has been selected THEN item-preview-toolbar div should be with expected role attribute`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. select the 'modified' folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Verify that Item Preview toolbar has 'toolbar' role attribute:
            await contentItemPreviewPanel.waitForToolbarRoleAttribute('toolbar');
        });

    it(`GIVEN modified folder is selected WHEN the folder has been published THEN 'Show changes' button gets hidden in the item preview toolbar`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. select the 'modified' folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Publish the folder:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('show_changes_button_hidden');
            // 3. Verify that 'Show Changes' button gets hidden in the preview toolbar:
            await contentItemPreviewPanel.waitForShowChangesButtonNotDisplayed();
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
