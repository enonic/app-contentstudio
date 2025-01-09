/**
 * Created on 13.07.2018.
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');

describe('close.issue.with.item.spec: close an issue and verify control elements on the ItemPreview Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const ISSUE_TITLE = appConst.generateRandomName('issue');
    let TEST_FOLDER;

    // verifies https://github.com/enonic/app-contentstudio/issues/356
    // Endless spinner after clicking on Create Issue button
    it(`GIVEN no selections in the grid WHEN 'Create Issue...' button has been pressed  THEN Create Issue dialog should appear`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.clickOnCreateIssueButton();
            await createIssueDialog.waitForDialogLoaded();
            await createIssueDialog.waitForSpinnerNotVisible(appConst.TIMEOUT_5);
        });

    it('Precondition: new folder and new issue have been created',
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            // 1.Add new folder:
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await contentBrowsePanel.waitForPublishButtonVisible();
            // 2.expand the menu and open 'Create Issue' dialog
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            // 3. Save the issue:
            await createIssueDialog.clickOnCreateIssueButton();
            await issueDetailsDialog.waitForDialogLoaded();
        });

    it(`GIVEN folder is selected AND 'Issue Details Dialog' is opened WHEN 'Closed' tab menu button has been pressed THEN issue-menu button gets not visible in Preview Panel`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let issueListDialog = new IssueListDialog();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 1. Open IssueDetails modal dialog:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogLoaded();
            // 2. Click on 'Closed' tab menu-tem:
            await issueDetailsDialog.clickOnIssueStatusSelectorAndCloseIssue();
            // 3. modal dialog has been closed:
            await issueDetailsDialog.clickOnCancelTopButton();
            // 4. Verify that toolbar in ItemPreviewPanel is displayed (the content is selected);
            await contentItemPreviewPanel.waitForPreviewWidgetDropdownDisplayed();
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
