/**
 * Created on 03.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const InsertAnchorDialog = require('../../page_objects/wizardpanel/html-area/insert.anchor.dialog.cke');
const InsertSpecialDialog = require('../../page_objects/wizardpanel/html-area/insert.special.character.dialog.cke');
const InsertMacroDialog = require('../../page_objects/wizardpanel/macro/insert.macro.dialog.cke');
const appConst = require('../../libs/app_const');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');

describe('htmlarea.cke.toolbar.spec: tests for toolbar in html-area(CKE editor)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const NORWEGIAN_TEXT = "Hej og hå så kan det gå";
    const EXPECTED_URL = '<p><a href="http://google.com">Hej og hå så kan det gå</a></p>';
    const EXPECTED_TEXT_SOFT_HYPHEN = "<p><span class=\"shy\">&shy;</span></p>\n";
    const SOFT_HYPHEN = 'Soft hyphen';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN 'insert special characters' dialog is opened WHEN 'Soft hyphen' special character has been clicked THEN '&shy' should be present in the htmlArea`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertSpecialDialog = new InsertSpecialDialog();
            // 1.  new wizard for htmlArea content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            // 2. 'Insert Special Character' button has been clicked:
            await htmlAreaForm.showToolbarAndClickOnInsertSpecialCharactersButton();
            await insertSpecialDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('cke_insert_special_char_dialog');
            // 3. 'Soft hyphen' button has been clicked:
            await insertSpecialDialog.clickOnItemByTitle(SOFT_HYPHEN);
            // 4. Verify that the dialog is closed and expect text appears in the area:
            await insertSpecialDialog.waitForClosed();
            await studioUtils.saveScreenshot('cke_insert_special_char_soft_hyphen');
            let actualText = await htmlAreaForm.getTextInHtmlArea(0);
            assert.equal(actualText, EXPECTED_TEXT_SOFT_HYPHEN, 'expected text should be displayed in Html Area ');
        });

    it(`GIVEN wizard for 'htmlArea' is opened WHEN 'Find and replace' button has been clicked THEN search form should be loaded`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1.  new wizard for htmlArea content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. 'Find and replace' button has been pressed:
            await htmlAreaForm.showToolbarAndClickOnFindAndReplaceButton();
            await studioUtils.saveScreenshot('find_and_replace_cke');
            // 3. Verify: search form should be loaded:
            await htmlAreaForm.waitForReplaceGroupVisible();
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert image' icon has been clicked THEN 'Insert Image Dialog' should appear`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            // 1.  new wizard for htmlArea content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await studioUtils.saveScreenshot('cke_insert_image_dialog1');
            // 2. Verify that 'Insert Image Dialog should appear:
            await insertImageDialog.waitForDialogVisible();
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert anchor' icon has been clicked THEN 'Insert Anchor Dialog' should appear`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertAnchorDialog = new InsertAnchorDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertAnchorButton();
            await studioUtils.saveScreenshot('cke_insert_anchor_dialog1');
            // 'Insert Anchor' Dialog should appear:
            await insertAnchorDialog.waitForDialogLoaded();
            await insertAnchorDialog.pause(1000);
            // verifies XP-4949: HTML Area - Modal dialogs must handle close on Esc
            await insertAnchorDialog.pressEscKey();
            await insertAnchorDialog.waitForDialogClosed();
        });


    it(`GIVEN 'insert macro' dialog is opened WHEN 'Cancel' button has been pressed THEN 'Insert Macro Dialog' should be closed`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertMacroDialog = new InsertMacroDialog();
            // 1.  new wizard for htmlArea content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            // 2.  Insert Macro dialog has been opened:
            await htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            await insertMacroDialog.waitForDialogLoaded();
            await insertMacroDialog.clickOnCancelButton();
            // 'Insert Macro' dialog should be closed, after clicking on 'Cancel' button:
            await insertMacroDialog.waitForDialogClosed();
        });

    it(`WHEN 'htmlArea' content is opened THEN Increase Indent, Bulleted List, Align Right,Table buttons should be present on the toolbar`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbar();
            // Verify that B/U/I are not displayed in the htmlArea toolbar(they are present only in Full screen dialog)
            await htmlAreaForm.waitForBoldButtonNotDisplayed();
            await htmlAreaForm.waitForItalicButtonNotDisplayed();
            await htmlAreaForm.waitForUnderlineButtonNotDisplayed();

            let result = await htmlAreaForm.isBulletedListButtonDisplayed();
            assert.ok(result, 'Bulleted List button should be present');
            await htmlAreaForm.isAlignLeftButtonDisplayed();
            assert.ok(result, 'Align Left button should be present');
            result = await htmlAreaForm.isNumberedListButtonDisplayed();
            assert.ok(result, 'Numbered List button should be present');
            result = await htmlAreaForm.isAlignRightButtonDisplayed();
            assert.ok(result, 'Align Right button should be present');
            result = await htmlAreaForm.isCenterButtonDisplayed();
            assert.ok(result, 'Center button should be present');
            result = await htmlAreaForm.isIncreaseIndentButtonDisplayed();
            assert.ok(result, 'Increase Indent button should be present');
            result = await htmlAreaForm.isTableButtonDisplayed();
            assert.ok(result, 'Table button should be present');
            // 'Decrease Indent' button should be present
            await htmlAreaForm.waitForDecreaseIndentDisplayed();
            await htmlAreaForm.waitForIncreaseIndentDisplayed();
        });

    it(`GIVEN wizard for 'htmlArea' is opened AND 'Insert Link' button has been pressed WHEN 'url-link' has been inserted, THEN correct data should be in CKE`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.pause(1000);
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            await insertLinkDialog.typeInLinkTextInput(NORWEGIAN_TEXT);
            // 3. insert the URL:
            await insertLinkDialogUrlPanel.typeUrl('http://google.com');
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 4. Save the content:
            await contentWizard.waitAndClickOnSave();
            // 5. get text in Html-area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('htmlarea_0_1_url_link');
            assert.equal(result[0], EXPECTED_URL, 'correct data should be in CKE');
        });

    it("GIVEN wizard for 'htmlArea' is opened WHEN 'format-dropdown' handle has been clicked THEN expected options should appear",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            await htmlAreaForm.showToolbarAndClickOnFormatDropDownHandle();
            let result = await htmlAreaForm.getFormatOptions();
            await studioUtils.saveScreenshot('htmlarea_format_options');
            assert.equal(result[0], "Normal", 'expected option should be visible');
            assert.equal(result[1], "Heading 1", 'Heading 1 option should be visible');
            assert.equal(result[2], "Heading 2", 'Heading 2 option should be visible');
            assert.equal(result[3], "Heading 3", 'Heading 3 option should be visible');
            assert.equal(result[4], "Heading 4", 'Heading 4 option should be visible');
        });

    it(`GIVEN wizard for 'htmlArea' is opened and text is entered WHEN 'Heading 1' option has been selected THEN expected text should be in area`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            await htmlAreaForm.typeTextInHtmlArea('test');
            // 2. Click on the dropdown handle:
            await htmlAreaForm.showToolbarAndClickOnFormatDropDownHandle();
            // 3. Select Heading 1 :
            await htmlAreaForm.selectFormatOption('Heading 1');
            // 4. Check text in the area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('heading_1_cke');
            assert.equal(result[0], "<h1>test</h1>", 'expected text should be in area');
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN 'Table' menu item has been clicked THEN drop down menu with table should appear`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // new wizard is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // Insert Table button has been pressed:
            await htmlAreaForm.showToolbarAndClickOnTableButton();
            await studioUtils.saveScreenshot('table_drop_down_menu_cke');
            // drop down menu with table should appear:
            await htmlAreaForm.isTableMenuItemVisible();
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
