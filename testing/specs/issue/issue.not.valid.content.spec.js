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
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('issue.not.valid.content.spec: create an issue with not valid content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    it(`GIVEN existing folder with one not valid child is selected WHEN 'Create Issue' menu item has been selected and issue created THEN '10' number should be in 'Items' on IssueDetailsDialog`,
        () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_2_NAME).then(() => {
                return contentBrowsePanel.waitForPublishButtonVisible();
            }).then(()=>{
                //open 'Create Issue' dialog
                return contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(() => {
                return createIssueDialog.clickOnIncludeChildrenToggler(appConstant.TEST_FOLDER_2_DISPLAY_NAME);
            }).then(result => {
                studioUtils.saveScreenshot("create_issue_dialog1");
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                studioUtils.saveScreenshot("issue_details_should_be_loaded");
                return issueDetailsDialog.waitForDialogOpened();
            }).then(()=>{
                return issueDetailsDialog.pause(1000);
            }).then(() => {
                return issueDetailsDialog.getNumberOfItems();
            }).then(result => {
                return assert.equal(result, '10', 'Ten items should be displayed in the `Items`link');
            });
        });

    it(`GIVEN issue with not valid item is clicked WHEN Items-tab has been clicked THEN 'Publish & Close Issue' button should be disabled, because invalid child is present`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return assert.eventually.isFalse(issueDetailsDialogItemsTab.isPublishAndCloseIssueButtonEnabled(),
                    'Publish & Close button should be disabled, because invalid child is present');
            });
        });

    it(`GIVEN Items-tab has been clicked WHEN not valid content has been excluded THEN 'Publish...' button is getting enabled`,
        () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.excludeDependantItem('shortcut-imported');
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
