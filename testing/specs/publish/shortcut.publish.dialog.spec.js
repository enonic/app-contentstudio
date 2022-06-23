/**
 * Created on 16.05.2018.
 * verifies : app-contentstudio#72 Keyboard shortcut to publish content(s)
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');

describe('Browse Panel - Keyboard shortcut to publish content', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let FOLDER_1;

    //verifies : app-contentstudio#72 Keyboard shortcut to publish content(s)
    it(`GIVEN content is selected WHEN 'Ctrl+Alt+P' have been pressed THEN Publish Dialog should appear`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER_1 = contentBuilder.buildFolder(displayName);
            //1. Add new folder with Ready for publishing state:
            await studioUtils.doAddReadyFolder(FOLDER_1);
            //2. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER_1.displayName);
            await contentBrowsePanel.hotKeyPublish();
            await contentPublishDialog.waitForDialogOpened();
            //Publish button should be enabled, because this content automatically gets "Ready to Publish"
            await contentPublishDialog.waitForPublishNowButtonEnabled();
        });

    it(`GIVEN 'Work in progress' and 'Ready to Publish' folders are selected WHEN 'Ctrl+Alt+P' have been pressed THEN Publish now button should be disabled`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();

            let displayName = contentBuilder.generateRandomName('folder');
            let folder2 = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(folder2);

            await studioUtils.findContentAndClickCheckBox(FOLDER_1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);

            await contentBrowsePanel.hotKeyPublish();
            await contentPublishDialog.waitForDialogOpened();
            //Publish button should be disabled, because one content is "Work in progress"
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
