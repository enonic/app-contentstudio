/**
 * Created on 12.12.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('publish.request.create.close.spec - request publish dialog - click on Publish Now',
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let TEST_FOLDER1;
        let REQ_TITLE= "request 1"
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
                //3. Click on 'Publish Now' button and close the request:
                await publishRequestDetailsDialog.waitForPublishNowButtonEnabled();
                await publishRequestDetailsDialog.waitForCloseRequestButtonDisplayed();
                let result = await publishRequestDetailsDialog.getItemDisplayNames();
                assert.equal(result[0], TEST_FOLDER1.displayName, "Expected item to publish should be present in the dialog");
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

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
