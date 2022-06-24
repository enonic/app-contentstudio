/**
 * Created on 08.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const HtmlAreaForm = require('../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../page_objects/wizardpanel/insert.image.dialog.cke');
const appConst = require('../libs/app_const');

describe('insert.image.dlg.style.selector.spec: style selector, select Original option', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.POP_03;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN htmlarea-content, image is selected on the modal dialog WHEN click on dropdown handle in styles selector THEN expected options should be present`,
        async () => {
            let insertImageDialog = new InsertImageDialog();
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open wizard with html-area:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            //2. Open 'Insert Image' dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            //3. Select the image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            //4. Click on dropdown handle and expand the style-options:
            let actualOptions = await insertImageDialog.getStyleSelectorOptions();
            studioUtils.saveScreenshot('image_digradlew cleanalog_style_options');
            assert.equal(actualOptions[0], "<None>", "First option should be '<None>' ");
            assert.equal(actualOptions[1], appConst.IMAGE_STYLE_ORIGINAL, "one available option should be present in options list");
        });

    it(`GIVEN htmlarea-content, image is selected on the modal dialog WHEN 'Original' option has been selected THEN 'Custom Width' checkbox is getting disabled`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            //1. Open wizard with html-area:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            //2. Open 'Insert Image' dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            //3. Select the image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            //4. Type the text in 'filter input' and click on the option
            await insertImageDialog.doFilterStyleAndClickOnOption("Original");
            //5. Verify that 'Custom Width' checkbox gets disabled:
            await insertImageDialog.waitForCustomWidthCheckBoxDisabled();
            //6. 'Custom Width' checkbox should be unchecked:
            let isChecked = await insertImageDialog.isCustomWidthCheckBoxSelected();
            assert.isFalse(isChecked, "'Custom Width' checkbox should be unchecked");
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
