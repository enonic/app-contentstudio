/**
 * Created on 09.02.2022  updated on 03.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const BrowseAttachmentsItemView = require('../../page_objects/browsepanel/detailspanel/browse.attachments.widget');

describe('attachments.widget.spec: Tests for attachments widget in Details Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it("WHEN image content has been selected THEN attachment's name should be displayed on the widget",
        async () => {
            let attachmentsItemView = new BrowseAttachmentsItemView();
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.HAND);
            await studioUtils.saveScreenshot('attachment_widget_image');
            await attachmentsItemView.waitForLoaded();
            let result = await attachmentsItemView.getAttachmentsName();
            assert.equal(result[0], appConst.TEST_IMAGES.HAND + '.jpg', "Expected content name should be displayed in the widget")
        });

    it("WHEN existing folder content has been selected THEN attachments section should not be displayed in Details widget",
        async () => {
            let attachmentsItemView = new BrowseAttachmentsItemView();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot('attachment_widget_folder');
            // Attachments section is not rendered for a content without attachments:
            await attachmentsItemView.waitForNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndNavigateToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
