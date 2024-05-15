/**
 * Created on 05.01.2017.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const appConst = require('../../libs/app_const');

describe('issue.list.dialog.spec: Issue List modal Dialog specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`WHEN 'Issues List Dialog' has been opened THEN required control elements should be present`,
        async () => {
            let issueListDialog = new IssueListDialog();
            await studioUtils.openIssuesListDialog();
            let title = await issueListDialog.getTitle();
            assert.strictEqual(title, 'Issues', 'Expected dialog hider should be displayed');
            // 'Open' button should be displayed
            await issueListDialog.waitForOpenButtonDisplayed();
            let closedButtonDisplayed = await issueListDialog.isClosedButtonDisplayed();
            assert.ok(closedButtonDisplayed, "'Closed' button should be displayed");

            let typeFilter = await issueListDialog.isTypeFilterSelectorDisplayed();
            assert.ok(typeFilter, "'Type Filter' selector  should be displayed");

            let result = await issueListDialog.getTypeFilterSelectedOption();
            assert.ok(result.includes(`All`), "All' option should be selected by default");
            await issueListDialog.waitForNewIssueButtonDisplayed();
        });

    it(`GIVEN 'Issues List Dialog' has been opened WHEN 'New task' button has been clicked THEN 'Create Task' dialog should be loaded`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openIssuesListDialog();
            // 'New issue' button has been clicked:
            await issueListDialog.clickOnNewIssueButton();
            // Create Issue modal dialog should be loaded:
            await createIssueDialog.waitForDialogLoaded();
        });

    it(`WHEN 'Issues List Dialog' has been opened THEN 'Open' issues should be loaded by default`,
        async () => {
            let issueListDialog = new IssueListDialog();
            await studioUtils.openIssuesListDialog();
            let openButton = await issueListDialog.isOpenButtonActive();
            assert.ok(openButton, 'Open issues should be loaded by default');
            let isClosedButtonActive = await issueListDialog.isClosedButtonActive();
            assert.ok(isClosedButtonActive === false, "'Closed' button should be grey color by default");
        });

    it(`GIVEN 'Issues List Dialog' has been opened WHEN 'Esc' key has been clicked THEN issues list dialog closes`,
        async () => {
            let issueListDialog = new IssueListDialog();
            // 1. Open Issues List Dialog:
            await studioUtils.openIssuesListDialog();
            // 2. Click on Esc:
            await issueListDialog.pressEscKey();
            await issueListDialog.waitForDialogClosed();
        });

    // TODO it(`GIVEN 'Issues List Dialog' is opened WHEN 'Closed' button has been clicked THEN 'Open' button is getting not active`,
    // TODO it(`GIVEN 'Issues List Dialog' is opened WHEN type filter selector  has been expanded THEN required options should be present in the selector`


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
