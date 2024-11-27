/**
 * Created on 26.11.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('image.content.preview.widget.dropdown.spec - Tests for Live View', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it("GIVEN an image is selected WHEN 'Media' has been selected in the Preview widget dropdown THEN img html element should be visible in the iframe in Item Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            // 2. Select 'Media' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            await studioUtils.saveScreenshot('image_selected_media_selected');
            // 3. Switch to the iframe and verify that <Img> element gets visible in the iframe in Item Preview Panel:
            await contentItemPreviewPanel.waitForImageElementDisplayed();
            await contentItemPreviewPanel.switchToParentFrame();
            // 4. Verify that 'Preview' button should be enabled when an image is selected
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
        });

    it("GIVEN an image is selected WHEN 'JSON' has been selected in the Preview widget dropdown THEN img html element should be visible in the iframe in Item Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            // 2. Select 'Media' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.JSON);
            await studioUtils.saveScreenshot('image_selected_json_selected');
            // 3. Switch to the iframe and verify that <Img> element gets visible in the iframe in Item Preview Panel:
            await contentItemPreviewPanel.waitForImageElementDisplayed();
            await contentItemPreviewPanel.switchToParentFrame();
            // 4. Verify that 'Preview' button should be enabled when an image is selected
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
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
