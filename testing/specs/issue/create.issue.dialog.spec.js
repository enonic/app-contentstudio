/**
 * Created on 12.01.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const appConst = require('../../libs/app_const');

describe('create.issue.dialog.spec: Create Issue Dialog specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN 'Issues List' dialog is opened WHEN 'New Issue...' button has been clicked THEN 'Create Task Dialog' should be loaded`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openIssuesListDialog();
            //Click on 'New Task...' button
            await issueListDialog.clickOnNewIssueButton();
            //modal dialog should be loaded:
            await createIssueDialog.waitForDialogLoaded();
        });

    it(`WHEN 'Create Issue' dialog is opened THEN all required inputs should be present`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openCreateIssueDialog();
            let dialogTitle = await createIssueDialog.getDialogTitle();
            assert.equal(dialogTitle, "New Issue", "Required dialog's title should be displayed");
            //Title input should be present:
            let result = await createIssueDialog.isTitleInputDisplayed();
            assert.isTrue(result, 'Title input should be present');

            result = await createIssueDialog.isCancelButtonTopDisplayed();
            assert.isTrue(result, 'Cancel bottom top should be present');
            result = await createIssueDialog.isCancelButtonBottomDisplayed();
            assert.isTrue(result, 'Cancel bottom button should be present');

            result = await createIssueDialog.isDescriptionTextAreaDisplayed();
            assert.isTrue(result, 'Description text area should be present');
            await studioUtils.saveScreenshot("create_issue_add_item_button");

            // 'Add Items' button should be displayed when no item has been selected in the grid
            await createIssueDialog.isAddItemsButtonDisplayed();
            assert.isTrue(result, "'Add Items' button should be present");

            result = await createIssueDialog.isAssigneesOptionFilterDisplayed();
            assert.isTrue(result, 'Assignees option filter input should be present');

            result = await createIssueDialog.isItemsOptionFilterDisplayed();
            assert.isFalse(result, "'Items' option filter input should not be present");
        });

    it(`GIVEN 'Create Issue' dialog is opened all inputs are empty WHEN 'Create Issue' button has been pressed THEN validation message should appear`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.clickOnCreateIssueButton();

            await studioUtils.saveScreenshot("check_validation_message");
            let result = await createIssueDialog.getValidationMessageForTitleInput();
            assert.equal(result, appConst.THIS_FIELD_IS_REQUIRED, "Expected validation message should appear");
        });

    it(`GIVEN 'Create Issue' has been opened WHEN 'Esc' key has been clicked THEN modal dialog closes`,
        async () => {
            let createIssueDialog = new CreateIssueDialog();
            //1. Open Issues List Dialog:
            await studioUtils.openCreateIssueDialog();
            await createIssueDialog.pause(300);
            //2. Click on Esc:
            await createIssueDialog.pressEscKey();
            await createIssueDialog.waitForDialogClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
