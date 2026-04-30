/**
 * Created on 09.09.2019. updated on 23.03.2026 for epic-enonic-ui
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');

describe('browse.panel.mark.as.ready.single.content.spec - tests for Request Publishing and Publish menu items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;

    it("WHEN 'Work in progress' folder is selected AND 'Publish...' menu item has been clicked THEN publishing wizard should be opened AND the folder is Work in progress",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let name = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(name);
            //1. 'Work in progress' folder has been added:
            await studioUtils.doAddFolder(TEST_FOLDER);
            //2. Click on checkbox and select the folder:
            await studioUtils.findContentAndClickCheckBox(name);
            //3. Click on 'Publish...' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            // 4. Verify that Publishing wizard is opened:
            await contentPublishDialog.waitForDialogOpened();
            // 5. Verify that 'Exclude items in progress' button is not displayed in the dialog:
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            // Publish now  button should be disabled:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 6. Click on 'Mark as ready' button in the modal dialog:
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            let status = await contentPublishDialog.getContentStatus(name);
            await studioUtils.saveScreenshot('content_gets_ready_to_publish');
            assert.equal(status, appConst.CONTENT_STATUS.OFFLINE_NEW, "The content gets 'Ready for publishing'");
            let numberItems = await contentPublishDialog.getNumberItemsToPublish();
            assert.equal(numberItems,'', "Number of items to publish should not be displayed when the single content is selected");
        });

    it(`WHEN 'Work in progress' folder is selected AND 'Request Publishing...' menu item has been clicked THEN request publish dialog should be opened AND the folder gets Ready to publish`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let name = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(name);
            // 1. 'Work in progress' folder has been added:
            await studioUtils.doAddFolder(TEST_FOLDER);
            // 2. Click on checkbox and select the folder
            await studioUtils.findContentAndClickCheckBox(name);
            // 3. Click on 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.typeInTitleInput('test request publish');
            // 4. Verify that the modal dialog is loaded:
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.waitForCreateRequestButtonDisabled();
            // 5. Click on 'Mark as Ready' button in the modal dialog:
            await createRequestPublishDialog.clickOnMarkAsReadyButton();
            // 6. Verify that 'Next' button is enabled:
            await createRequestPublishDialog.waitForCreateRequestButtonEnabled();
            let workflow = await createRequestPublishDialog.getWorkflowIconState(name);
            assert(workflow === 'ready', "Workflow icon should be 'Ready for publishing'");
            let state = await createRequestPublishDialog.getContentStatus(name);
            await studioUtils.saveScreenshot('ready_to_publish_via_menu_action');
            assert(state === appConst.CONTENT_STATUS.OFFLINE_NEW, 'Offline New status should be displayed for the content');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(async() => {
        await studioUtils.doPressEscape();
        await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
