/**
 * Created on 12.01.2018. updated 11.02.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const appConst = require('../../libs/app_const');

describe('create.issue.dialog.spec: Create Issue Dialog specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const DIALOG_TITLE = 'New Issue';

    it(`GIVEN 'Issues List' dialog is opened WHEN 'New issue' button has been clicked THEN 'Create Issue' dialog should be loaded`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let createIssueDialog = new CreateIssueDialog();
            // 1. Click on 'Open Issues' button in the toolbar:
            await studioUtils.openIssuesListDialog();
            let actualOption = await issueListDialog.getSelectedOptionInFilterDropdown();
            assert.ok(actualOption.includes(appConst.ISSUE_LIST_TYPE_FILTER.ALL), `'All' option should be selected by default`);
            // 2. Click on 'New Issue...' button
            await issueListDialog.clickOnNewIssueButton();
            // 3. 'Create Issue' modal dialog should be loaded:
            await createIssueDialog.waitForDialogLoaded();
            // 4. 'Create Issue' button should be disabled, because all required inputs are empty:
            await createIssueDialog.waitForCreateIssueButtonDisabled();
            let dialogTitle = await createIssueDialog.getDialogTitle();
            assert.equal(dialogTitle, DIALOG_TITLE, 'expected title should be displayed in the dialog');
        });

    it(`WHEN 'Create Issue' modal dialog has been opened THEN 'Create Issue' button should be disabled, after filling in only description and selecting item in content combobox 'Create Issue' button should still be disabled, after filling in required inputs should be enabled`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.waitForCreateIssueButtonDisabled();
            await createIssueDialog.typeTextInDescriptionTextArea('test description');
            await createIssueDialog.waitForCreateIssueButtonDisabled();
            await studioUtils.saveScreenshot('create_issue_add_item_button');
            await createIssueDialog.selectItemInContentCombobox('man');
            await createIssueDialog.waitForCreateIssueButtonDisabled();
            await createIssueDialog.typeTitle('issue');
            await createIssueDialog.waitForCreateIssueButtonEnabled();
            //await createIssueDialog.clickOnCreateIssueButton();
            //await createIssueDialog.waitForNotificationMessages();

        });

    it(`GIVEN 'Create Issue' has been opened WHEN 'Esc' key has been clicked THEN modal dialog closes`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            // 1. Open Issues List Dialog:
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.pause(700);
            // 2. Click on Esc:
            await createIssueDialog.pressEscKey();
            await createIssueDialog.waitForDialogClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
