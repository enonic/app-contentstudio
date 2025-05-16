/**
 * Created on 17.04.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');

describe("unpublish.dialog.inbound.ref.spec - Tests for inbound references in Unpublish modal dialog", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');
    const SHORTCUT_NAME_2 = contentBuilder.generateRandomName('shortcut');
    const FOLDER_NAME = contentBuilder.generateRandomName('folder');


    it(`Preconditions: published folder and  shortcut and one not published shortcut should be created`,
        async () => {
            // add new 'published' shortcut and folder
            FOLDER = contentBuilder.buildFolder(FOLDER_NAME);
            await studioUtils.doAddPublishedFolder(FOLDER);
            let shortcut = contentBuilder.buildShortcut(SHORTCUT_NAME, FOLDER_NAME);
            await studioUtils.doAddPublishedShortcut(shortcut);
            // add a shortcut (work in progress)
            let shortcut2 = contentBuilder.buildShortcut(SHORTCUT_NAME_2, FOLDER_NAME);
            await studioUtils.doAddShortcut(shortcut2);
        });

    it(`GIVEN Unpublish content dialog is opened WHEN 'Ignore inbound references' link has been clicked THEN 'Unpublish' button gets enabled in the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            // 1. Select a published folder that has inbound references
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. 'Unpublish...' button has been clicked:
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('unpublish_dlg_references');
            // 3. Click on 'Ignore inbound references' link:
            await contentUnpublishDialog.clickOnIgnoreInboundReferences();
            // 4. Verify that Unpublish button gets enabled:
            await contentUnpublishDialog.waitForUnpublishButtonEnabled();
            await contentUnpublishDialog.waitForIgnoreInboundReferencesButtonNotDisplayed();
        });

    it.skip(`GIVEN Unpublish content dialog is opened WHEN 'Show references' link has been clicked THEN 'Not published' referenced content should not be displayed in the filtered grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            // 1.Click on the image, that was selected in the shortcut
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. 'Unpublish...' button has been clicked:
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            // 3. Click on 'Show references' link:
            await contentUnpublishDialog.clickOnShowReferencesButton(FOLDER_NAME);
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot('published_ref_content');
            // 4. Verify that the only published ref-content should be displayed in the filtered grid:
            let refItems = await contentBrowsePanel.getDisplayNamesInGrid();
            // TODO uncomment this assert when the issue will be fixed
            //assert.ok(refItems.length === 1, `'Not published' referenced content should not be displayed`);
            //assert.equal(refItems[0], SHORTCUT_NAME, 'Only published ref-content should be displayed in the filtered grid ');
            let status = await contentBrowsePanel.getContentStatus(SHORTCUT_NAME);
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED, `'Published' status should be displayed for the filtered content`);
        });

    it.skip(`GIVEN 'Ignore inbound references' is displayed in Unpublish content dialog WHEN 'Show references' link has been clicked AND referenced content has been unpublished THEN 'Unpublish' button gets enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            // 1.Click on the image, that was selected in the shortcut
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. 'Unpublish...' button has been clicked:
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            // 3. Click on 'Show references' link:
            await contentUnpublishDialog.clickOnShowReferencesButton(FOLDER_NAME);
            await studioUtils.doSwitchToNextTab();
            // 4. Do unpublish the referenced content(shortcut)
            await contentBrowsePanel.clickOnRowByName(SHORTCUT_NAME);
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            await contentUnpublishDialog.clickOnUnpublishButton()
            await contentUnpublishDialog.waitForDialogClosed();
            await contentBrowsePanel.waitForNotificationMessage();
            // 5. switch to the tab with the folder:
            await studioUtils.doSwitchToPrevTab();
            await studioUtils.saveScreenshot('unpublish_dlg_ignore_inbound_ref_gets_not_visible');
            // 6. Verify that 'Unpublish' button gets enabled, 'Ignore inbound references' gets not visible now:
            await contentUnpublishDialog.waitForIgnoreInboundReferencesButtonNotDisplayed()
            await contentUnpublishDialog.waitForUnpublishButtonEnabled();
            await contentUnpublishDialog.waitForIgnoreInboundReferencesButtonNotDisplayed();
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
