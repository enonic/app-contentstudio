/**
 * Created on 11.01.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('htmlarea.insert.image.dialog.spec: open insert image dialog.', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const ALT_TEXT = 'alternative text';
    const IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.POP_03;
    const IMAGE_DISPLAY_NAME_2 = appConst.TEST_IMAGES.POP_02;
    const IMAGE_WIT_ALT_TEXT = appConst.TEST_IMAGES.MONET_004;
    const EXISTING_ALT_TXT = 'alternative test';
    const TEST_CAPTION = 'caption 1234567';
    const TEST_CAPTION_2 = 'caption 987654321';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // Verify the bug HtmlArea field refuses to save item and display image in preview #8824
    // https://github.com/enonic/app-contentstudio/issues/8824
    it(`GIVEN Align Center button has been pressed in the Insert Image dialog WHEN 'Insert' button has been opened THEN expected styles for the image should be applied in html-area`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image in the modal dialog
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 3. Click on align center button in the modal dialog:
            await insertImageDialog.clickOnParagraphCenterButton();
            // 3. Click on 'Decorative Text' radio:
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.typeCaption(TEST_CAPTION);
            // 7. Click on Insert button and close the dialog:
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('insert_image_align_center_html_area');
            // 8. Verify the image-alignment in html-area:
            await htmlAreaForm.switchToHtmlAreaFrame();
            let value = await htmlAreaForm.getInsertedImageStyle(TEST_CAPTION);
            assert.ok(value.includes('editor-align-center'), 'align center style should be applied to the image');
            await htmlAreaForm.switchToParentFrame();
            // 9. Save the content:
            let contentWizard = new ContentWizard();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('insert_image_align_center_html_area_2');
            await htmlAreaForm.switchToHtmlAreaFrame();
            // 10. Verify the image-alignment in html-area after saving:
            value = await htmlAreaForm.getInsertedImageStyle(TEST_CAPTION);
            assert.ok(value.includes('editor-align-center'), 'align center style should be applied to the image');
        });

    // Verify issue - https://github.com/enonic/app-contentstudio/issues/7571
    // Content with HtmlArea - Save button remains disabled after modifying image's caption #7571
    it(`GIVEN an image with a caption is inserted in htmlarea WHEN Update image dialog has been opened and the caption has been updated THEN Save button gets enabled after closing the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            await insertImageDialog.typeCaption(TEST_CAPTION);
            // 3. Click on 'Decorative' radio:
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            // 4. Click on Insert button and close the dialog:
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            await contentWizard.waitAndClickOnSave()
            // 5. Open Insert/Update Image dialog
            await htmlAreaForm.doubleClickOnHtmlArea();
            // 6. Update the caption:
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.typeCaption(TEST_CAPTION_2);
            await studioUtils.saveScreenshot('insert_image_caption_updated');
            // 7. Click on Insert button and close the dialog:
            await insertImageDialog.clickOnUpdateButton();
            await insertImageDialog.waitForDialogClosed();
            // 8. Verify that Save button gets enabled after updating the caption:
            await contentWizard.waitForSaveButtonEnabled();
        });

    // verifies XP-4949 HTML Area - Modal dialogs must handle close on Esc
    it(`GIVEN 'Insert Image' dialog is opened WHEN ESC key has been pressed THEN dialog should be closed`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await studioUtils.saveScreenshot('insert_image_esc_test1');
            await insertImageDialog.waitForDialogVisible();
            await contentWizard.pressEscKey();
            await studioUtils.saveScreenshot('insert_image_esc_test2');
            await insertImageDialog.waitForDialogClosed();
        });

    it(`GIVEN 'Insert Image' dialog is opened WHEN 'Cancel' button has been clicked THEN dialog should be closed`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            await insertImageDialog.clickOnCancelButton();
            await insertImageDialog.waitForDialogClosed();
        });

    it(`GIVEN 'Insert Image' dialog is opened WHEN both radio buttons should not be selected`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open a content with htmlAre:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 2. Click on 'Insert image' button in the toolbar:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 3. Select an image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 4. Verify that 'both radio-buttons are not selected:
            let isSelected = await insertImageDialog.isDecorativeImageRadioSelected();
            assert.ok(isSelected === false, `'Decorative image' radio-button is not selected`);
            isSelected = await insertImageDialog.isAlternativeTextRadioSelected();
            assert.ok(isSelected === false, `'Alternative text' radio-button is not selected`);
            // 5. Alternative text input should be disabled
            await insertImageDialog.waitForAlternativeTextInputDisabled();
        });

    it(`GIVEN 'Insert Image' dialog is opened WHEN 'DecorativeImage' radio button has been selected THEN the AccessibilityForm remains valid`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME)
            // 3. verify that AccessibilityForm is valid:
            await insertImageDialog.waitForAccessibilityFormValid();
            // 4. Select  'Decorative Image' radio button:
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            // 5. Verify that the form remains valid:
            await insertImageDialog.waitForAccessibilityFormValid();
            // 6. Alternative text input remains disabled
            await insertImageDialog.waitForAlternativeTextInputDisabled();
        });

    it(`GIVEN 'Insert Image' dialog is opened WHEN 'Alternative Text' radio button has been clicked THEN the form gets invalid`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 3. Click on 'Alternative Text' radio:
            await insertImageDialog.clickOnAlternativeTextRadioButton();
            // 4. Verify that the form gets invalid:
            await insertImageDialog.waitForAccessibilityFormInvalid();
            let actualText = await insertImageDialog.getValidationMessageInAccessibilityForm();
            assert.equal(actualText, 'Alt text cannot be empty', 'Expected validation message should be displayed');
            // 5. Fill in the text input:
            await insertImageDialog.typeInAlternativeTextInput(ALT_TEXT);
            // 6. Verify that the form gets valid:
            await insertImageDialog.waitForAccessibilityFormValid();
        });

    it(`GIVEN an image with 'Alternative Text' WHEN Update Image dialog has been opened THEN expected alt-text should be displayed in the form`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 3. Click on 'Alternative Text' radio:
            await insertImageDialog.clickOnAlternativeTextRadioButton();
            // 5. Fill in the text input:
            await insertImageDialog.typeInAlternativeTextInput(ALT_TEXT);
            // 6. Verify that the form gets valid:
            await insertImageDialog.waitForAccessibilityFormValid();
            // 7. Click on Insert button and close the dialog:
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            // 8. Open Insert/Update Image dialog
            await htmlAreaForm.doubleClickOnHtmlArea();
            await insertImageDialog.waitForDialogVisible();
            await studioUtils.saveScreenshot('insert_image_dlg_alt_text');
            // 9. Verify that expected alt-text is displayed in the input:
            let text = await insertImageDialog.getTextInAlternativeTextInput();
            assert.equal(text, ALT_TEXT, "expected alt-text is displayed in the input");
            // 10. The radio button should be selected:
            let isSelected = await insertImageDialog.isAlternativeTextRadioSelected();
            assert.ok(isSelected, `'Alternative text' radio-button should be selected`);
            // 11. Alternative text input should be enabled
            await insertImageDialog.waitForAlternativeTextInputEnabled();
        });

    it(`GIVEN text has been inserted in 'Alternative Text' input WHEN the image has been replaced in the dialog THEN 'Alternative Text' input should be cleared`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            // 3. Click on 'Alternative Text' radio:
            await insertImageDialog.clickOnAlternativeTextRadioButton();
            // 5. Fill in the text input:
            await insertImageDialog.typeInAlternativeTextInput(ALT_TEXT);
            // 6. Click on 'remove selected option' icon :
            await insertImageDialog.clickOnRemoveImageIcon();
            // 7. Select another image:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME_2);
            await studioUtils.saveScreenshot('insert_image_dlg_image_changed');
            // 8. Verify that Alternative text input is cleared
            let actualText = await insertImageDialog.getTextInAlternativeTextInput();
            assert.equal(actualText, '', 'The input should be cleared after updating an image');
            // 9. Both radio buttons should not be selected:
            let isSelected = await insertImageDialog.isDecorativeImageRadioSelected();
            assert.ok(isSelected === false, `'Decorative image' radio-button is not selected`);
            isSelected = await insertImageDialog.isAlternativeTextRadioSelected();
            assert.ok(isSelected === false, `'Alternative text' radio-button is not selected`);
            await insertImageDialog.waitForAlternativeTextInputDisabled();
        });

    it(`GIVEN image binary has alt text WHEN Insert image dialog opened THEN expected 'alternative text' should be loaded in the modal dialog`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            // 1. Open Insert Image dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 2. Select an image with an alt-text:
            await insertImageDialog.filterAndSelectImage(IMAGE_WIT_ALT_TEXT);
            // 3. Verify - expected 'alt text' should be loaded from image-properties in the modal dialog:
            let actualText = await insertImageDialog.getTextInAlternativeTextInput();
            assert.equal(actualText, EXISTING_ALT_TXT, 'Expected alt-text should be displayed in the input');
            // 4. 'Alternative text' radio-button should not be selected:
            let isSelected = await insertImageDialog.isAlternativeTextRadioSelected();
            assert.ok(isSelected === false, `'Alternative text' radio-button should not be selected`);
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
