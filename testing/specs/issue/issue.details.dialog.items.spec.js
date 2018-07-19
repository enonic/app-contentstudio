/**
 * Created on 21.02.2018.
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


describe('issue.details.dialog.items.spec: add items and check it on ItemsTabItem', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    it(`GIVEN existing folder with images is selected WHEN 'Create Issue' menu item has been selected and issue created THEN '1' number should be in 'Items' on IssueDetailsDialog`,
        () => {
            //this.bail(1);
            return studioUtils.findAndSelectItem(appConstant.TEST_FOLDER_NAME).then(() => {
                return studioUtils.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.getNumberOfItems();
            }).then((result) => {
                return assert.equal(result, '1', 'One number should be displayed in the `Items`link');
            });
        });

    it(`GIVEN Issue Details Dialog is opened WHEN Items-tab has been clicked THEN 'Publish & Close Issue' button and Content Combobox should be displayed`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialog.isItemsTabBarItemActive();
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isContentOptionsFilterInputPresent(),
                    'Content option filter input should be present');
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isPublishAndCloseIssueButtonPresent(),
                    '`Publish & Close Issue` should be present');
            });
        });

    it(`GIVEN Items-tab has been clicked WHEN 'Include Child Items' icon has been clicked THEN 'Show dependent items' link should appear`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.clickOnIncludeChildItems("All Content types images");
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isShowDependentItemsLinkDisplayed(),
                    '`Show dependent items` link should appear');
            }).then(() => {
                return issueDetailsDialog.getNumberOfItemsInTabMenuBar();
            }).then(result => {
                assert.equal(result, '11', 'Number of items should be updated to 11');
            }).then(() => {
                return expect(issueDetailsDialogItemsTab.getNumberInDependentItemsLink()).to.eventually.equal('10');
            })
        });

    it(`GIVEN existing issue (child items are included) WHEN issue details is opened THEN 'Show dependent items' link should be present`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isShowDependentItemsLinkDisplayed(),
                    '`Show dependent items` link should be present');
            }).then(() => {
                return issueDetailsDialog.getNumberOfItemsInTabMenuBar();
            }).then(result => {
                return assert.equal(result, '11', 'Correct number of items should be displayed');
            })
        });

    it(`GIVEN existing issue (child items are included) WHEN issue details is opened  AND 'Show Dependent items' link has been clicked THEN 'hide dependent items' link should appear`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.clickOnShowDependentItems();
            }).then(() => {
                return assert.eventually.isTrue(issueDetailsDialogItemsTab.isHideDependentItemsLinkDisplayed(),
                    'Hide dependent items link should appears')
            })
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
