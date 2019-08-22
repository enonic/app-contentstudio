/**
 * Created on 13.04.2018.
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

describe('issue.details.dialog.items.spec: add items and check it on ItemsTabItem', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    it(`GIVEN existing folder with images is selected WHEN 'Create Issue' menu item has been selected and issue created THEN '1' number should be in 'Items' on IssueDetailsDialog`,
        () => {
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
                // Publish button is getting visible, because the content is 'New' and valid
                return contentBrowsePanel.waitForPublishButtonVisible();
            }).then(() => {
                //open 'Create Issue' dialog
                return contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.getNumberOfItems();
            }).then(result => {
                return assert.equal(result, '1', 'One number should be displayed in the `Items`link');
            });
        });

    it(`GIVEN Issue Details Dialog is opened WHEN Items-tab has been clicked THEN 'Publish & Close Issue' button and Content Combobox should be displayed`,
        () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialog.isItemsTabBarItemActive();
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isContentOptionsFilterInputPresent(),
                    'Content option filter input should be present');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isPublishButtonDisplayed(), '`Publish...` should be present');
            });
        });

    it(`GIVEN Items-tab has been clicked WHEN 'Include Child Items' icon has been clicked THEN 'Show dependent items' link should appear`,
        () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.clickOnIncludeChildItems(appConstant.TEST_FOLDER_WITH_IMAGES);
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isShowDependentItemsLinkDisplayed(),
                    '`Show dependent items` link should appear');
            }).then(() => {
                return issueDetailsDialog.getNumberInItemsTab();
            }).then(result => {
                assert.equal(result, '13', 'Number of items should be updated to 13');
            }).then(() => {
                return expect(issueDetailsDialogItemsTab.getNumberInDependentItemsLink()).to.eventually.equal('12');
            })
        });

    it(`GIVEN existing issue (child items are included) WHEN issue details is opened THEN 'Show dependent items' link should be present`,
        () => {
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isShowDependentItemsLinkDisplayed(),
                    '`Show dependent items` link should be present');
            }).then(() => {
                return issueDetailsDialog.getNumberInItemsTab();
            }).then(result => {
                return assert.equal(result, '13', 'Correct number of items should be displayed');
            })
        });

    it(`GIVEN existing issue (child items are included) WHEN issue details is opened  AND 'Show Dependent items' link has been clicked THEN 'hide dependent items' link should appear`,
        () => {
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.clickOnShowDependentItems();
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isHideDependentItemsLinkDisplayed(),
                    'Hide dependent items link should appears')
            })
        });

    it(`GIVEN existing issue (child items are included) WHEN issue details is opened  AND 'Exclude child items' icon has been clicked THEN number of items to publish should be decreased `,
        () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            let issueListDialog = new IssueListDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.clickOnIncludeChildrenToggler(appConstant.TEST_FOLDER_WITH_IMAGES);
            }).then(() => {
                return issueDetailsDialog.getNumberInItemsTab();
            }).then(result => {
                return assert.equal(result, '1', 'only one item should be in the link');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
