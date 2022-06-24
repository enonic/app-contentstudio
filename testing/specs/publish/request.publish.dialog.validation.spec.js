/**
 * Created on 15.01.2020.
 * verifies Publish Content dialog - Validation messages should be reset when the dialog is reopened #1199
 *          https://github.com/enonic/app-contentstudio/issues/1199
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');

describe('request.publish.dialog.validation.spec - opens request publish modal dialog and checks validation message', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it("GIVEN existing folder with children(valid) is selected AND 'Request Publishing...' menu item has been clicked WHEN 'Include child' icon has been clicked THEN Invalid icon should not be visible",
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. folder with children(all the children are valid) is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            //2. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_FOLDER_WITH_IMAGES);
            studioUtils.saveScreenshot("request_publish_include_children2");
            //3. Invalid icon should not be visible, because all the children are valid:
            await createRequestPublishDialog.waitForInvalidIconNotDisplayed();
        });

    it("GIVEN existing folder with children(one child is not valid) is selected AND 'Request Publishing...' menu item has been clicked WHEN 'Include child' icon has been clicked THEN Invalid icon gets visible",
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. folder with children(all the children are valid) is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_2_NAME);
            //expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            //2. click on 'Include children items':
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            studioUtils.saveScreenshot("request_publish_include_children4");
            //3. Invalid icon gets visible, because on of the children is not valid:
            await createRequestPublishDialog.waitForInvalidIconDisplayed();
        });

    it("GIVEN two folders with children WHEN 'Create Request Publish Dialog' dialog is reopened THEN Validation messages should be reset",
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. folder with children(all the children are valid) is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_2_NAME);
            //2. expand the Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            //3. Do include not valid child:
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            studioUtils.saveScreenshot("request_publish_include_children3");
            //Validation messages should appear:
            await createRequestPublishDialog.waitForInvalidIconDisplayed();

            //4. Close the modal dialog:
            await createRequestPublishDialog.pressEscKey();
            await createRequestPublishDialog.waitForDialogClosed();
            //5. reopen the dialog with another selected folder(all the children are valid:)
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_FOLDER_WITH_IMAGES);
            //Validation messages should be reset:(invalid icon is not visible)
            await createRequestPublishDialog.waitForInvalidIconNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp()
    );
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome()
    );
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
