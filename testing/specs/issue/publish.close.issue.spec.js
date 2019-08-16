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
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");

describe('publish.close.issue.spec: publish a content and close the issue.', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');

    let TEST_FOLDER;
    it(`Precondition: create new folder and create new issue for it`, async () => {
        let issueDetailsDialog = new IssueDetailsDialog();
        let createIssueDialog = new CreateIssueDialog();
        let contentBrowsePanel = new ContentBrowsePanel();
        let displayName = contentBuilder.generateRandomName('folder');
        TEST_FOLDER = contentBuilder.buildFolder(displayName);
        //Do add new 'Marked as ready' folder:
        await studioUtils.doAddReadyFolder(TEST_FOLDER);
        await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);

        //open 'Create Issue' dialog
        await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
        await createIssueDialog.typeTitle(issueTitle);

        //Click on Create Issue button and create new issue:
        await createIssueDialog.clickOnCreateIssueButton();
        await issueDetailsDialog.waitForDialogOpened();
    });

    it(`GIVEN Issue Details Dialog is opened AND Items-tab activated WHEN 'Publish...' button has been pressed AND Publish Now has been pressed on the loaded wizard THEN the content should be published`,
        async () => {
            let issueListDialog = new IssueListDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogItemsTab = new IssueDetailsDialogItemsTab();
            //1.Open issues-list dialog and click on the issue:
            await studioUtils.openIssuesListDialog();
            await issueListDialog.clickOnIssue(issueTitle);
            await issueDetailsDialog.waitForDialogOpened();
            await issueDetailsDialog.clickOnItemsTabBarItem();

            //2. Click on Publish... button and open Publish Wizard dialog:
            await issueDetailsDialogItemsTab.clickOnPublishAndOpenPublishWizard();
            let contentPublishDialog = new ContentPublishDialog();
            //3. Click on 'Publish Now' button :
            await contentPublishDialog.clickOnPublishNowButton();

            //4. Verify the notification message:
            let message = await issueDetailsDialog.waitForNotificationMessage();
            let expected = appConstant.itemPublishedNotificationMessage(TEST_FOLDER.displayName);
            assert.equal(message, expected, 'expected message should be displayed');
            //TODO this behaviour will be changed!!!
            //eventually, Issues List dialog should be loaded:
            //await issueListDialog.waitForDialogOpened();
        });

    //verifies: Issue List Dialog - closed issues are not displayed until you create a new issue (app-contentstudio/issues/246)
    it(`GIVEN just closed issue WHEN issue list dialog opened THEN the issue should be present in 'closed' issues`, () => {
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
