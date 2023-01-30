/**
 * Created on 31.01.2023
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const contentBuilder = require('../../libs/content.builder');

describe('request.publish.dialog.validation.spec - opens request publish modal dialog and checks validation message', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    it("Precondition: two 'work in progress' folders should be added",
        async () => {
            PARENT_FOLDER = contentBuilder.buildFolder(appConst.generateRandomName('parent'));
            CHILD_FOLDER = contentBuilder.buildFolder(appConst.generateRandomName('child'));
            await studioUtils.doAddFolder(PARENT_FOLDER);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 1. Select the parent folder and add a child folder:
            await studioUtils.doAddFolder(CHILD_FOLDER);
        });

    it("GIVEN the parent folder is selected AND 'Request Publishing...' menu item has been clicked WHEN 'Include child' icon has been clicked THEN 'mark as ready' and 'Exclude items in progress' buttons should be visible",
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. parent folder with children is selected:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // expand 'Publish Menu' and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(PARENT_FOLDER.displayName);
            await studioUtils.saveScreenshot('request_publish_mark_as_ready_btn');
            // 3. Verify 'mark as ready' and 'Exclude items in progress' buttons:
            await createRequestPublishDialog.waitForMarkAsReadyButtonDisplayed();
            await createRequestPublishDialog.waitForExcludeItemsInProgressButtonDisplayed();
            // 4. Verify that Next button is disabled
            await createRequestPublishDialog.waitForNextButtonDisabled();
        });

    it("GIVEN  'Request Publishing' modal dialog is opened WHEN 'Exclude items in progress' icon has been clicked THEN 'mark as ready' button remains visible",
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. parent folder with children is selected:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // expand 'Publish Menu' and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(PARENT_FOLDER.displayName);
            // 3. Click on 'Exclude items in progress' button:
            await createRequestPublishDialog.clickOnExcludeItemsInProgressButton();
            await studioUtils.saveScreenshot('request_publish_items_in_progress_excluded');
            // 4. Verify that only 'Mark as ready' button is displayed:
            await createRequestPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            await createRequestPublishDialog.waitForMarkAsReadyButtonDisplayed();
            // 5. Verify that 'Next' button remains disabled
            await createRequestPublishDialog.waitForNextButtonDisabled();
        });

    it("GIVEN 'Include child' icon has been clicked in 'Request Publishing' modal dialog WHEN 'mark as ready button' and has been clicked THEN 'Next' button gets enabled",
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. parent folder with children is selected:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // expand 'Publish Menu' and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 2. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(PARENT_FOLDER.displayName);
            // 3. Click on 'Exclude items in progress' button:
            await createRequestPublishDialog.clickOnMarkAsReadyButton();
            // 4. Notification message should appear:
            await contentBrowsePanel.waitForNotificationMessage();
            // 5. Verify that 'Exclude items in progress' and 'Mark as ready' button gets not visible:
            await createRequestPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            await createRequestPublishDialog.waitForMarkAsReadyButtonNotDisplayed();
            // 6. Verify that 'Next' button gets enabled:
            await studioUtils.saveScreenshot('request_publish_next_btn_enabled');
            await createRequestPublishDialog.waitForNextButtonEnabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
