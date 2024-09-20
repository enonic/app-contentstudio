/**
 * Created on 17.01.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('insert.image.dlg.apply.custom.style.spec: apply a custom style to an image', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.POP_03;
    const HTML_AREA_CONTENT_NAME = contentBuilder.generateRandomName('hrtmlarea');
    const CINEMA_STYLE = 'Cinema';
    const CINEMA_STYLE_VALUE = 'editor-style-image-cinema'

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN Insert Image modal dialog is opened THEN none option should be selected in styles-selector by default`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open new wizard with html-area:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            // 2. Open 'Insert Image' dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 3. Select the image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 4. verify style-option that is selected by default
            let actualOption = await insertImageDialog.getSelectedStyleValue();
            await studioUtils.saveScreenshot('image_dialog_custom_style_options');
            assert.equal(actualOption, 'none', "None is selected option by default");
        });

    it(`GIVEN Insert Image modal dialog is opened WHEN 'Cinema' option has been selected THEN 'Custom Width' checkbox should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open new wizard with html-area and open Insert Image dialog:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(HTML_AREA_CONTENT_NAME);
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 3. Select the image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            // 4. Select 'Cinema' in the selector:
            await insertImageDialog.selectImageStyle(CINEMA_STYLE);
            // 5. Verify that 'Custom Width' checkbox is enabled
            await insertImageDialog.waitForCustomWidthCheckBoxEnabled();
            // checkbox should be unselected
            let isChecked = await insertImageDialog.isCustomWidthCheckBoxSelected();
            assert.ok(isChecked === false, 'Custom Width checkbox should be unchecked');
            // just save the changes and save the content
            await insertImageDialog.clickOnInsertButton();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN existing htmlarea-content with image(Custom Style) is opened WHEN double click in htmmlarea THEN expected style should be present in style selector`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open existing content:
            await studioUtils.selectContentAndOpenWizard(HTML_AREA_CONTENT_NAME);
            await htmlAreaForm.pause(2000);
            // 2. Do double-click in htmlArea and open InsertImage dialog:
            await htmlAreaForm.doubleClickOnHtmlArea();
            await insertImageDialog.waitForDialogVisible();
            // 3. Verify the selected style option:
            let actualStyle = await insertImageDialog.getSelectedStyleValue();
            // Cinema style should be selected in the dialog
            await studioUtils.saveScreenshot('image_dialog_custom_style_should_be_cinema');
            assert.equal(actualStyle, CINEMA_STYLE_VALUE, "Expected style should be present in the selector");
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
