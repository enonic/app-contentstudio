/**
 * Created on 12.01.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const issueListDialog = require('../page_objects/issue/issue.list.dialog');
const createIssueDialog = require('../page_objects/issue/create.issue.dialog');


describe('create.issue.dialog.spec: Create Issue Dialog specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN 'Issues List' dialog is opened WHEN 'New Issue...' button has been clicked THEN 'Create Issue Dialog' should be loaded `,
        () => {
            this.bail(1);
            return studioUtils.openIssuesListDialog().then(()=> {
                return issueListDialog.clickOnNewIssueButton();
            }).then(()=> {
                return createIssueDialog.waitForDialogLoaded();
            });
        });

    it(`WHEN 'Create Issue' dialog is opened THEN all required inputs should be present`,
        () => {
            return studioUtils.openCreateIssueDialog().then(()=> {
                return createIssueDialog.isTitleInputDisplayed();
            }).then(result=> {
                assert.isTrue(result, 'Title input should be present');
            }).then(()=> {
                return assert.eventually.isTrue(createIssueDialog.isCancelButtonTopDisplayed(), 'Cancel bottom top should be present');
            }).then(()=> {
                return assert.eventually.isTrue(createIssueDialog.isCancelButtonBottomDisplayed(),
                    'Cancel bottom button should be present');
            }).then(()=> {
                return assert.eventually.isTrue(createIssueDialog.isDescriptionTextAreaDisplayed(),
                    'Description text area should be present');
            }).then(()=> {
                return assert.eventually.isTrue(createIssueDialog.isAddItemsButtonDisplayed(), 'Add Items button should be present');
            }).then(()=> {
                return assert.eventually.isTrue(createIssueDialog.isAssigneesOptionFilterDisplayed(),
                    'Assignees option filter input should be present');
            }).then(()=> {
                return assert.eventually.isFalse(createIssueDialog.isItemsOptionFilterDisplayed(),
                    'Items option filter input should not be present');
            })
        });

    it(`GIVEN 'Create Issue' dialog is opened WHEN 'Create Issue' button has been pressed THEN validation message should appear`,
        () => {
            return studioUtils.openCreateIssueDialog().then(()=> {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(()=> {
                return createIssueDialog.getValidationMessageForTitleInput()
            }).then((result)=> {
                return assert.isTrue(result == 'This field is required');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());

    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
