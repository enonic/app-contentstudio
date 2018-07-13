/**
 * Created on 10.07.2018.
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
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const contentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('publish.issue.details.dialog.items.spec: 2 item added and published', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    let folder1;
    let folder2;
    it(`Precondition: WHEN two folders has been added THEN folders should be present in the grid`,
        () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            return studioUtils.doAddFolder(folder1).then(() => {
            }).then(() => {
                return studioUtils.doAddFolder(folder2);
            }).then(() => {
                return studioUtils.typeNameInFilterPanel(folder1.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(folder1.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'folder should be listed in the grid');
            });
        });
    it(`GIVEN two folders are selected WHEN new issue has been created THEN items tab on 'Issue Details Dialog' should be loaded with correct data`,
        () => {
            return studioUtils.findContentAndClickCheckBox(folder1.displayName).then(() => {
                return studioUtils.findContentAndClickCheckBox(folder2.displayName)
            }).then(() => {
                return studioUtils.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(() => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.getItemDisplayNames();
            }).then(result => {
                assert.isTrue(result.includes(folder1.displayName));
                assert.isTrue(result.includes(folder2.displayName));
            }).then(() => {
                return expect(issueDetailsDialog.getNumberOfItemsInTabMenuBar()).to.eventually.equal('2');
            }).then(() => {
                return expect(issueDetailsDialogItemsTab.getContentStatus(folder1.displayName)).to.eventually.equal('New');
            })
        });

    it(`GIVEN Issue Details Dialog is opened AND Items-tab activated WHEN 'Publish & Close Issue' button has been pressed THEN issue should be closed and the content should be published`,
        () => {
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnIssue(issueTitle);
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.clickOnItemsTabBarItem();
            }).then(() => {
                return issueDetailsDialogItemsTab.clickOnPublishAndCloseIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForNotificationMessage();
            }).then(messages => {
                let expected = appConstant.issueClosedNotificationMessage(issueTitle);
                assert.isTrue(messages.includes(appConstant.TWO_ITEMS_PUBLISHED), '`2 items are published` message should be displayed');
                assert.isTrue(messages.includes(expected), '`Issue is closed` message should be displayed');
            }).then(() => {
                return assert.eventually.isTrue(issueListDialog.waitForDialogVisible(), 'Issue List Dialog should be loaded');
            });
        });

    it(`GIVEN two items are published WHEN both items has been selected THEN issue-menu button should not be visible on the toolbar `,
        () => {
            return studioUtils.findContentAndClickCheckBox(folder1.displayName).then(() => {
                return studioUtils.findContentAndClickCheckBox(folder2.displayName)
            }).then(() => {
                return contentItemPreviewPanel.waitForIssueMenuButtonNotVisible();
            }).then(result => {
                studioUtils.saveScreenshot("issue_menu_should_be_hidden");
                assert.isTrue(result, 'Issue Menu button should not be visible, because issue has been published and closed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
