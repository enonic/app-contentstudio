/**
 * Created on 09.02.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const AttachmentsItemView = require('../../page_objects/browsepanel/detailspanel/attachments.widget');

describe('attachments.widget.spec: Tests for attachments widget in Details Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it("WHEN image content has been selected THEN attachment's name should be displayed on the widget",
        async () => {
            let attachmentsItemView = new AttachmentsItemView();
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.HAND);
            await studioUtils.saveScreenshot("attachment_widget_image");
            let result = await attachmentsItemView.getAttachmentsName();
            assert.equal(result[0], appConst.TEST_IMAGES.HAND + ".jpg", "Expected content name should be displayed in the widget")
        });

    it("WHEN existing folder content has been selected THEN 'This item has no attachments' should be displayed in the widget",
        async () => {
            let attachmentsItemView = new AttachmentsItemView();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot("attachment_widget_folder");
            let placeholder = await attachmentsItemView.getAttachmentsPlaceholder();
            assert.equal(placeholder, 'This item has no attachments', "Expected message should be displayed in the widget")
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
