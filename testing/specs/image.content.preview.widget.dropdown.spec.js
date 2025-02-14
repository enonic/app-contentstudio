/**
 * Created on 26.11.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('image.content.preview.widget.dropdown.spec - Tests for Live View', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`GIVENan image is selected WHEN Emulator dropdown has been expanded THEN expected resolutions should be present in the dropdown`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Open the existing site:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            await studioUtils.saveScreenshot('emulator_widget_menu_2');
            // 2. Expand the dropdown and verify all available resolutions:
            await contentItemPreviewPanel.clickOnEmulatorDropdown();
            let actualResolutions = await contentItemPreviewPanel.getEmulatorResolutions();
            assert.equal(actualResolutions.length, 8, '8 resolutions should be present in the widget');
        });

    it("WHEN an image is selected WHEN 'Small Phone' 320x480 has been selected THEN expected style should appear in the iframe in Item Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image and verify the default option in the Emulator widget dropdown:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            let option = await contentItemPreviewPanel.getSelectedOptionInEmulatorDropdown();
            assert.equal(option, appConst.EMULATOR_RESOLUTION_VALUE.FULL_SIZE, "'100%' option should be selected by default");
            // 2.  'Small Phone' has been selected in Emulator widget dropdown:
            await contentItemPreviewPanel.selectOptionInEmulatorDropdown(appConst.EMULATOR_RESOLUTION.SMALL_PHONE);
            await studioUtils.saveScreenshot('image_selected_small_phone_selected');
            // 3. Verify that '320px' option should be selected in the dropdown:
            option = await contentItemPreviewPanel.getSelectedOptionInEmulatorDropdown();
            assert.equal(option, appConst.EMULATOR_RESOLUTION_VALUE.SMALL_PHONE, "'320px' option should be selected in the dropdown");
            // 4. Verify that style should appear in the iframe:
            let style = await contentItemPreviewPanel.getPreviewIframeStyle();
            assert.ok(style.includes('width: 320px; height: 480px;'), "Expected style should appear in the iframe");
            // 5. Switch to the iframe and verify that <Img> element gets visible in the iframe in Item Preview Panel:
            await contentItemPreviewPanel.waitForImageElementDisplayed();
            await contentItemPreviewPanel.switchToParentFrame();
            // 6. Verify that 'Preview' button should be enabled when an image is selected
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
        });

    it("WHEN an image is selected WHEN 'Automatic' is selected in 'Preview widget dropdown' by default THEN img html element should be visible in the iframe in Item Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            // 2.  'Automatic' should be in the Preview widget dropdown be default:
            let option = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            assert.equal(option, appConst.PREVIEW_WIDGET.AUTOMATIC, "Automatic option should be selected by default");
            await studioUtils.saveScreenshot('image_selected_automatic_selected');
            // 3. Switch to the iframe and verify that <Img> element gets visible in the iframe in Item Preview Panel:
            await contentItemPreviewPanel.waitForImageElementDisplayed();
            await contentItemPreviewPanel.switchToParentFrame();
            // 4. Verify that 'Preview' button should be enabled when an image is selected
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
        });

    it("GIVEN an image is selected WHEN 'Media' has been selected in the 'Preview widget dropdown' THEN img html element should be visible in the iframe in Item Preview Panel",
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

    it("GIVEN an image is selected WHEN 'JSON' has been selected in the Preview widget dropdown THEN expected info should be displayed in Item Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            // 2. Select 'JSON' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.JSON);
            await studioUtils.saveScreenshot('image_selected_json_selected');
            // 3. Verify that image-name should be displayed in JSON:
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let actualName = await contentItemPreviewPanel.getJSON_info(appConst.LIVE_VIEW_JSON_KEY.NAME);
            assert.equal(actualName, `"${appConst.TEST_IMAGES.RENAULT}.jpg"`, "Expected name should be displayed in JSON");
            // 4. Verify that image-displayName should be displayed in JSON:
            let actualDisplayName = await contentItemPreviewPanel.getJSON_info(appConst.LIVE_VIEW_JSON_KEY.DISPLAY_NAME);
            assert.equal(actualDisplayName, `"${appConst.TEST_IMAGES.RENAULT}"`, "Expected name should be displayed in JSON");
            // 5. Verify that 'Preview' button should be enabled when an image is selected
            await contentItemPreviewPanel.switchToParentFrame();
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
        });

    it("GIVEN an image is selected WHEN 'Enonic rendering' has been selected in the 'Preview widget dropdown' THEN 404 error should be displayed in the iframe in Item Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            // 2. Select 'Enonic rendering' in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await studioUtils.saveScreenshot('image_selected_enonic_rendering_selected');
            // 3. Switch to the iframe and verify that 404 error is displayed in the iframe in Item Preview Panel:
            await contentItemPreviewPanel.switchToLiveViewFrame();
            await contentItemPreviewPanel.waitFor404ErrorDisplayed();
            await contentItemPreviewPanel.switchToParentFrame();
            // 4. Verify that 'Preview' button should be enabled when an image and 'Enonic rendering' are selected
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
