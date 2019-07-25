/**
 * Created on 21.02.2018.
 * verifies
 * 1. https://github.com/enonic/app-contentstudio/issues/246
 *  Issue List Dialog - closed issues are not displayed until you create a new issue
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
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('publish.close.issue.spec: publish a content and close issue spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    let TEST_FOLDER;
    it(`Precondition: create a folder and create new issue`, () => {
        let issueDetailsDialog = new IssueDetailsDialog();
        let createIssueDialog = new CreateIssueDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        let displayName = contentBuilder.generateRandomName('folder');
        TEST_FOLDER = contentBuilder.buildFolder(displayName);
        return studioUtils.doAddFolder(TEST_FOLDER).then(() => {
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
        }).then(() => {
            return contentBrowsePanel.waitForMarkAsReadyButtonVisible();
        }).then(() => {
            //open 'Create Issue' dialog
            return contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
        }).then(() => {
            return createIssueDialog.typeTitle(issueTitle);
        }).then(result => {
            return createIssueDialog.clickOnCreateIssueButton();
        }).then(() => {
            return issueDetailsDialog.waitForDialogOpened();
        })
    });

    it(`GIVEN Issue Details Dialog is opened AND Items-tab activated WHEN 'Publish & Close Issue' button has been pressed THEN issue should be closed and the content should be published`,
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
                //TODO change the test
                return issueDetailsDialogItemsTab.clickOnPublishAndCloseIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForNotificationMessages();
            }).then(messages => {
                let expected1 = appConstant.itemPublishedNotificationMessage(TEST_FOLDER.displayName);
                let expected2 = appConstant.issueClosedNotificationMessage(issueTitle);
                assert.isTrue(messages.includes(expected1), '`Item is published` message should be displayed');
                assert.isTrue(messages.includes(expected2), '`Issue is closed` message should be displayed');
            }).then(() => {
                return assert.eventually.isTrue(issueListDialog.waitForDialogOpened(), 'Issue List Dialog should be loaded');
            });
        });

    //verifies: Issue List Dialog - closed issues are not displayed until you create a new issue (app-contentstudio/issues/246)
    it(`GIVEN just closed issue WHEN issue list dialog opened THEN the issue should be present in 'closed' issues`, () => {
        let issueDetailsDialog = new IssueDetailsDialog();
        let issueListDialog = new IssueListDialog();
        return studioUtils.openIssuesListDialog().then(() => {
        }).then(() => {
            studioUtils.saveScreenshot("verify_issue_246");
            return issueListDialog.clickOnShowClosedIssuesButton();
        }).then(() => {
            studioUtils.saveScreenshot('closed_issue');
            return issueListDialog.isIssuePresent(issueTitle);
        }).then(result => {
            assert.isTrue(result, 'required issue should be present in `closed issues`');
        });
    });

    it(`GIVEN issue is published and closed WHEN when an item from the issue is selected in the grid THEN Published status should be displayed in the content-grid`,
        () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
            }).then(() => {
                studioUtils.saveScreenshot("issue_published_content_is_published");
                return contentBrowsePanel.getContentStatus(TEST_FOLDER.displayName);
            }).then(result => {
                studioUtils.saveScreenshot('content_should_be_published');
                assert.isTrue(result == 'Published', 'Content should be published, because the issue has been published`');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
