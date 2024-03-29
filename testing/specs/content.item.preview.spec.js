/**
 * Created on 22.03.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('content.item.preview.spec - Select a content file and check expected info in Item Preview Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TEST_CONTENT_NAME = 'test-text.txt';

    it(`WHEN existing *.txt file is selected WHEN expected text should be loaded in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(TEST_CONTENT_NAME);
            await contentItemPreviewPanel.pause(500);
            await studioUtils.saveScreenshot('text_attachment_preview');
            let result = await contentItemPreviewPanel.getTextInAttachmentPreview();
            assert.ok(result.includes('Belarus'), "expected text should be present in the Preview Panel");
        });

    it(`WHEN existing folder has been selected THEN 'Preview not available' should be shown in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing folder:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_2_NAME);
            // 2. Verify that 'Preview not available' is displayed
            await studioUtils.saveScreenshot('preview_not_available');
            await contentItemPreviewPanel.waitForPreviewNotAvailAbleMessageDisplayed();
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
