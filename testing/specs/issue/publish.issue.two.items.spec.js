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
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");

describe('publish.issue.two.items.spec: 2 item added and published', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let ISSUE_TITLE = appConstant.generateRandomName('issue');
    let folder1;
    let folder2;
    it(`Precondition: WHEN two 'Work in Progress' folders has been added THEN folders should be present in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            //do add the first folder:
            await studioUtils.doAddFolder(folder1);
            // add the second folder:
            await studioUtils.doAddFolder(folder2);
            await studioUtils.typeNameInFilterPanel(folder1.displayName);
            await contentBrowsePanel.waitForContentDisplayed(folder1.displayName);
        });
    it(`GIVEN two folders are selected WHEN new issue has been created THEN items tab on 'Issue Details Dialog' should be loaded with expected data`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            //1. Do both folders 'Mark as Ready':
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName)
            await contentBrowsePanel.clickOnMarkAsReadyButtonAndConfirm();
            await contentBrowsePanel.waitForPublishButtonVisible();

            //2. Open 'Create Issue' dialog and create new issue:
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createIssueDialog.typeTitle(ISSUE_TITLE);
            await createIssueDialog.clickOnCreateIssueButton();
            await issueDetailsDialog.clickOnItemsTabBarItem();

            // 3. Verify issue's data:
            let result = await issueDetailsDialogItemsTab.getItemDisplayNames();
            assert.isTrue(result.includes(folder1.displayName));
            assert.isTrue(result.includes(folder2.displayName));
            let actualNumber = await issueDetailsDialog.getNumberOfItemsInTabMenuBar();
            assert.equal(actualNumber, '2', "2 items to publish should be present in the dialog");
            let status = await issueDetailsDialogItemsTab.getContentStatus(folder1.displayName)
            assert.equal(status, 'New', "New content-status should be displayed in the dialog");

        });

    it(`GIVEN 'Issue Details Dialog' is opened AND Items-tab activated WHEN 'Publish...' button has been pressed THEN 2 content should be published`,
        async () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            await studioUtils.openIssuesListDialog();
            //1. Open Issue Details Dialog:
            await issueListDialog.clickOnIssue(ISSUE_TITLE);
            await issueDetailsDialog.waitForDialogOpened();
            //2.Go to Items tab:
            await issueDetailsDialog.clickOnItemsTabBarItem();
            //Click on Publish... button and open Publishing Wizard
            await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            //3. Click on Publish Now button :
            await contentPublishDialog.clickOnPublishNowButton();
            let message = await issueDetailsDialog.waitForNotificationMessage();
            //let expected = appConstant.issueClosedNotificationMessage(issueTitle);
            assert.equal(message, appConstant.TWO_ITEMS_PUBLISHED, '`2 items are published` message should be displayed');
            // assert.isTrue(messages.includes(expected), '`Issue is closed` message should be displayed');
            //4. 'Issue List Dialog should be loaded'
            //await issueListDialog.waitForDialogOpened();
        });

    it(`GIVEN two items are published WHEN both items has been selected THEN issue-menu button should be visible on the toolbar because the issue was not closed `,
        () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            return studioUtils.findContentAndClickCheckBox(folder1.displayName).then(() => {
                return studioUtils.findContentAndClickCheckBox(folder2.displayName)
            }).then(() => {
                return contentItemPreviewPanel.waitForIssueNameInMenuButton(ISSUE_TITLE);
            }).then(result => {
                studioUtils.saveScreenshot("issue_menu_should_be_displayed");
                assert.isTrue(result, 'Issue Menu button should be visible, because issue was not closed');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
