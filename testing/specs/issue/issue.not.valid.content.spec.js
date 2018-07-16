/**
 * Created on 13.07.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const issueListDialog = require('../../page_objects/issue/issue.list.dialog');
const createIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const issueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const issueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');


describe('issue.not.valid.content.spec: create an issue with not valid content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    it(`GIVEN existing folder with one not valid child is selected WHEN 'Create Issue' menu item has been selected and issue created THEN '10' number should be in 'Items' on IssueDetailsDialog`,
        () => {
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_2_NAME).then(() => {
                return studioUtils.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(() => {
                return createIssueDialog.clickOnIncludeChildrenToggler(appConstant.TEST_FOLDER_2_DISPLAY_NAME);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).pause(1000).then(() => {
                return issueDetailsDialog.getNumberOfItems();
            }).then(result => {
                return assert.equal(result, '10', 'Ten items should be displayed in the `Items`link');
            });
        });

    it(`GIVEN issue with not valid item is clicked WHEN Items-tab has been clicked THEN 'Publish & Close Issue' button should be disabled, because invalid child is present`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return assert.eventually.isFalse(issueDetailsDialogItemsTab.isPublishAndCloseIssueButtonEnabled(),
                    'Publish & Close button should be disabled, because invalid child is present');
            });
        });

    it(`GIVEN Items-tab has been clicked WHEN not valid content has been excluded THEN 'Publish & Close Issue' button is getting enabled`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.excludeItem('shortcut-imported');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.waitForPublishAndCloseIssueButtonEnabled(),
                    'Publish & Close button is getting enabled, because invalid child was excluded');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
