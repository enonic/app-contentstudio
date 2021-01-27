/**
 * Created on 12.12.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const IssueDetailsDialogCommentsTab = require('../../page_objects/issue/issue.details.dialog.comments.tab');


describe('publish.request.create.close.spec - request publish dialog - open and clothe this request',
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let TEST_FOLDER1;
        let REQ_TITLE = contentBuilder.generateRandomName('req');

        it(`GIVEN new folder(Ready to Publish) is added and selected WHEN new Publish Request has been created THEN 'Request Details Dialog' should appear`,
            async () => {
                let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
                let browsePanel = new ContentBrowsePanel();
                let displayName = contentBuilder.generateRandomName('folder');
                TEST_FOLDER1 = contentBuilder.buildFolder(displayName);
                //1.Select existing folder:
                await studioUtils.doAddReadyFolder(TEST_FOLDER1);
                await studioUtils.findAndSelectItem(TEST_FOLDER1.displayName);
                //2. Create new 'Publish Request':
                await studioUtils.createPublishRequest(REQ_TITLE);
                let message = await browsePanel.waitForNotificationMessage();
                assert.equal(message, appConst.REQUEST_CREATED_MESSAGE, "'New publish request created successfully' message should appear");

                await publishRequestDetailsDialog.waitForTabLoaded();
                //3. Expected buttons should be present:
                await publishRequestDetailsDialog.waitForPublishNowButtonEnabled();
                let result = await publishRequestDetailsDialog.getItemDisplayNames();
                //4. Expected content should be present in items-to-publish:
                assert.equal(result[0], TEST_FOLDER1.displayName, "Expected item to publish should be present in the dialog");
            });

        //Verifies - Request Content Publish Dialog - roles should be filtered in Assignees -options #1312
        it(`GIVEN existing folder(Ready to Publish) AND Publish Request dialog is opened WHEN assignees-options have been expanded THEN roles should not be present in the assignees options`,
            async () => {
                let browsePanel = new ContentBrowsePanel();
                let createRequestPublishDialog = new CreateRequestPublishDialog();
                await studioUtils.findAndSelectItem(TEST_FOLDER1.displayName);
                //1. Open 'Publish Request' dialog:
                await browsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
                await createRequestPublishDialog.waitForDialogLoaded();
                await createRequestPublishDialog.pause(300);
                //3. Click on 'Next' button:
                await createRequestPublishDialog.clickOnNextButton();
                //3. Click on Assignees dropdown handle:
                await createRequestPublishDialog.clickOnAssigneesDropDownHandle();
                let options = await createRequestPublishDialog.getAssigneesOptions();
                assert.isFalse(options.includes("Authenticated"), "Roles should not be present in the assignees options");
            });

        it(`GIVEN existing Publish Request WHEN Request Details dialog is opened AND 'Publish Now' button has been pressed THEN modal dialog closes and this request closes`,
            async () => {
                let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
                let contentItemPreviewPanel = new ContentItemPreviewPanel();
                let browsePanel = new ContentBrowsePanel();
                await studioUtils.findAndSelectItem(TEST_FOLDER1.displayName);
                await contentItemPreviewPanel.clickOnIssueMenuButton();
                await publishRequestDetailsDialog.waitForTabLoaded();
                await publishRequestDetailsDialog.clickOnPublishNowButton();
                await publishRequestDetailsDialog.waitForClosed();
                let expectedMsg1 = appConst.publishRequestClosedMessage(REQ_TITLE);
                let expectedMsg2 = appConst.itemPublishedNotificationMessage(TEST_FOLDER1.displayName);
                //Item "...." is published.
                await browsePanel.waitForExpectedNotificationMessage(expectedMsg1);
                await browsePanel.waitForExpectedNotificationMessage(expectedMsg2);
            });

        it(`GIVEN issues list dialog is opened AND navigated to closed issues-tab WHEN existing closed request has been reopened THEN the request gets 'Open' AND 'no items to publish' should appear`,
            async () => {
                let browsePanel = new ContentBrowsePanel();
                let issueListDialog = new IssueListDialog();
                let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
                await studioUtils.openIssuesListDialog();
                //1. Click on the request and open Request Details dialog:
                await issueListDialog.clickOnClosedButton();
                await issueListDialog.clickOnIssue(REQ_TITLE);
                await publishRequestDetailsDialog.waitForTabLoaded();
                //2. Click on 'Reopen Request' button:
                await publishRequestDetailsDialog.clickOnReopenRequestButton();
                let expectedMsg1 = appConst.THIS_PUBLISH_REQUEST_OPEN;
                await browsePanel.waitForExpectedNotificationMessage(expectedMsg1);
                studioUtils.saveScreenshot("request_reopened");
                //3. 'Open' label should appear in the status selector:
                let actualStatus = await publishRequestDetailsDialog.getCurrentStatusInStatusSelector();
                assert.equal(actualStatus, "Open", "'Open' status should be displayed in status selector button");
                let result = await publishRequestDetailsDialog.isNoActionLabelPresent();
                //4. `No items to publish' should be displayed:
                assert.isTrue(result, `No items to publish' should be displayed, because all items are published`);
            });

        it(`GIVEN existing 'Open' request WHEN text in comments-area has been typed THEN 'Comment & Close Request' button gets visible`,
            async () => {
                let issueListDialog = new IssueListDialog();
                let issueDetailsDialogCommentsTab = new IssueDetailsDialogCommentsTab();
                let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
                await studioUtils.openIssuesListDialog();
                //1. Click on the request and open 'Request Details' dialog:
                await issueListDialog.clickOnOpenButton();
                await issueListDialog.clickOnIssue(REQ_TITLE);
                await publishRequestDetailsDialog.waitForTabLoaded();
                //2. Click on 'Comments' tab:
                await publishRequestDetailsDialog.clickOnCommentsTabBarItem();
                await issueDetailsDialogCommentsTab.typeComment('my comment');
                //3. Comment & Close button should appear:
                studioUtils.saveScreenshot("request_commented");
                await issueDetailsDialogCommentsTab.waitForCommentAndCloseRequestButtonDisplayed();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
