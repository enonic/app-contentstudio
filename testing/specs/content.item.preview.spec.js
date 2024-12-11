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
    const TEXT_CONTENT_NAME = 'test-text.txt';
    const PPTX_CONTENT_NAME = 'presentation.pptx';

    it(`WHEN existing *.txt file is selected THEN expected text should be loaded in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(TEXT_CONTENT_NAME);
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
            await studioUtils.saveScreenshot('text_attachment_preview');
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let result = await contentItemPreviewPanel.getTextInAttachmentPreview();
            assert.ok(result.includes('Belarus'), "expected text should be present in the Preview Panel");
        });

    it(`GIVEN existing *.txt file is selected WHEN 'Media' option has been selected THEN expected text should be loaded in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(TEXT_CONTENT_NAME);
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            await studioUtils.saveScreenshot('text_attachment_media_preview');
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let result = await contentItemPreviewPanel.getTextInAttachmentPreview();
            assert.ok(result.includes('Belarus'), "expected text should be present in the Preview Panel");
        });

    it(`GIVEN existing *.txt file is selected WHEN 'Media' option is been selected AND 'Preview' button has been clicked THEN the content should be loaded in the new tab`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select a txt-content
            await studioUtils.findAndSelectItem(TEXT_CONTENT_NAME);
            // 2. Select 'Media' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            await studioUtils.saveScreenshot('text_attachment_media_preview');
            // 3. Click on 'Preview' button:
            await contentItemPreviewPanel.clickOnPreviewButton();
            // 4. Verify that the new tab is opened and expected text is displayed:
            await studioUtils.doSwitchToNewTab();
            await studioUtils.waitForElementDisplayed("//pre[contains(.,'Belarus')]");
        });

    it(`GIVEN existing *.txt file is selected WHEN 'Site engine' option has been selected THEN 404 should be loaded in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(TEXT_CONTENT_NAME);
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.SITE_ENGINE);
            await studioUtils.saveScreenshot('text_attachment_site_engine_preview');
            // 'Preview' button should be enabled for a text file and MEDIA option
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            await contentItemPreviewPanel.switchToLiveViewFrame();
            // 404 error should be displayed in the iframe
            await contentItemPreviewPanel.waitFor404ErrorDisplayed();
        });

    it(`GIVEN existing *.txt file is selected WHEN 'JSON' option has been selected THEN expected text should be loaded in Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(TEXT_CONTENT_NAME);
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.JSON);
            await studioUtils.saveScreenshot('text_attachment_json_preview');
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let actualName = await contentItemPreviewPanel.getJSON_info(appConst.LIVE_VIEW_JSON_KEY.NAME);
            assert.equal(actualName, `"${TEXT_CONTENT_NAME}"`, 'expected name should be displayed in JSON preview');
        });

    it(`WHEN existing folder has been selected THEN 'Preview not available' should be shown in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing folder:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_2_NAME);
            // 2. Verify that 'Preview not available' is displayed
            await studioUtils.saveScreenshot('preview_not_available');
            let actualMessage = await contentItemPreviewPanel.getNoPreviewMessage();
            assert.ok(actualMessage.includes('Preview not available'), 'expected message should be displayed');
            // 3. Preview button should be disabled for a folder
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
        });

    it(`WHEN existing 'pptx' content has been selected AND 'Site engine' option has been selected THEN 'Preview' button should be enabled in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing pptx content:
            await studioUtils.findAndSelectItem(PPTX_CONTENT_NAME);
            // 2. Select 'Media' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.SITE_ENGINE);
            // 3. Verify that 'Preview' button is disabled
            await studioUtils.saveScreenshot('site_engine_preview_button_disabled_for_pptx');
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            // 4. Verify that '404' is displayed
            await contentItemPreviewPanel.switchToLiveViewFrame();
            await contentItemPreviewPanel.waitFor404ErrorDisplayed();
        });

    it(`WHEN existing 'pptx' content has been selected AND 'Media' option has been selected THEN 'Preview' button should be disabled in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing pptx content:
            await studioUtils.findAndSelectItem(PPTX_CONTENT_NAME);
            // 2. Select 'Media' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            // 3. Verify that 'Preview' button is disabled
            await studioUtils.saveScreenshot('media_preview_button_disabled_for_pptx');
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();

        });

    it(`WHEN existing 'pptx' content AND 'Automatic' are selected THEN 'Preview' button should be disabled in Item Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an existing pptx content:
            await studioUtils.findAndSelectItem(PPTX_CONTENT_NAME);
            // 2. Verify that 'Preview' button is disabled
            await studioUtils.saveScreenshot('preview_button_media_enabled_for_pptx');
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            // 3. Verify the message in the preview panel
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
