/**
 * Created on 03.05.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const InsertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');
const InsertSpecialDialog = require('../../page_objects/wizardpanel/insert.special.character.dialog.cke');
const InsertMacroDialog = require('../../page_objects/wizardpanel/insert.macro.dialog.cke');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');

describe('htmlarea.cke.toolbar.spec:  toolbar in html area with CKE`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let EXPECTED_URL = '<p><a href="http://google.com">test</a></p>';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert image' icon has been clicked THEN 'Insert Image Dialog' should appear`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertImageDialog = new InsertImageDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            studioUtils.saveScreenshot('cke_insert_image_dialog1');
            //'Insert Image Dialog should appear'
            await insertImageDialog.waitForDialogVisible();
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert anchor' icon has been clicked THEN 'Insert Anchor Dialog' should appear`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertAnchorDialog = new InsertAnchorDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertAnchorButton();
            studioUtils.saveScreenshot('cke_insert_anchor_dialog1');
            //'Insert Anchor Dialog should appear'
            await insertAnchorDialog.waitForDialogLoaded();
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert special characters' icon has been clicked THEN 'Insert Special Characters Dialog' should appear`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertSpecialDialog = new InsertSpecialDialog();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.showToolbarAndClickOnInsertSpecialCharactersButton();
            await insertSpecialDialog.waitForDialogLoaded();
            studioUtils.saveScreenshot('cke_insert_special_char_dialog');
        });

    it(`GIVEN 'insert macro' dialog is opened WHEN Cancel button has been pressed  THEN 'Insert Macro Dialog' gets closed`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertMacroDialog = new InsertMacroDialog();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            }).then(() => {
                return insertMacroDialog.waitForDialogVisible();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_macro_dialog');
                assert.isTrue(result, 'Insert Macro Dialog should appear');
            }).then(() => {
                return insertMacroDialog.clickOnCancelButton();
            }).then(() => {
                return assert.eventually.isTrue(insertMacroDialog.waitForDialogClosed(),
                    "Insert Macro should be closed, when Cancel button has been pressed");
            })
        });

    it(`GIVEN 'htmlArea' content is opened WHEN 'insert link' icon has been clicked THEN 'Insert Link Dialog' should appear`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialog = new InsertLinkDialog();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            }).then(() => {
                return insertLinkDialog.waitForDialogLoaded();
            }).then(result => {
                studioUtils.saveScreenshot('cke_insert_link_dialog');
                assert.isTrue(result, 'Insert Link Dialog should appear');
            });
        });
    it(`WHEN 'htmlArea' content is opened THEN bold, italic, Underline,  buttons should be present on the toolbar`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return htmlAreaForm.showToolbar();
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isBoldButtonDisplayed(), 'Bold button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isItalicButtonDisplayed(), 'Italic button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isUnderlineButtonDisplayed(), 'Underline button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isBulletedListButtonDisplayed(), 'Bulleted List button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isAlignLeftButtonDisplayed(), 'Align Left button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isNumberedListButtonDisplayed(), 'Bulleted List button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isAlignRightButtonDisplayed(), 'Align Right button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isCenterButtonDisplayed(), 'Center button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isIncreaseIndentButtonDisplayed(), 'Increase Indent button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isTableButtonDisplayed(), 'Table button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isIncreaseIndentButtonDisplayed(), 'Increase Indent button should be present');
            }).then(() => {
                return assert.eventually.isTrue(htmlAreaForm.isDecreaseIndentDisplayed(), 'Decrease Indent button should be present');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened AND 'Insert Link' button has been pressed WHEN 'url-link' has been inserted, THEN correct data should be in CKE`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialog = new InsertLinkDialog();
            let contentWizard = new ContentWizard();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return contentWizard.pause(1000);
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            }).then(() => {
                return insertLinkDialog.typeText('test');
            }).then(() => {
                return insertLinkDialog.typeUrl('http://google.com');
            }).then(() => {
                return insertLinkDialog.clickOnInsertButton();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_0_1_url_link');
                assert.equal(result[0], EXPECTED_URL, 'correct data should be in CKE');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN 'format-dropdown' handle has been clicked THEN expected options should appear`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return htmlAreaForm.pause(1000);
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnFormatDropDownHandle();
            }).then(() => {
                return htmlAreaForm.getFormatOptions();
            }).then(result => {
                studioUtils.saveScreenshot('htmlarea_format_options');
                assert.equal(result[0], "Normal", 'expected option should be visible');
                assert.equal(result[1], "Heading 1", 'expected option should be visible');
                assert.equal(result[2], "Heading 2", 'expected option should be visible');
                assert.equal(result[3], "Heading 3", 'expected option should be visible');
                assert.equal(result[4], "Heading 4", 'expected option should be visible');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened and text is typed WHEN 'Heading 1' option has been selected THEN expected text should be in area`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return htmlAreaForm.pause(1000);
            }).then(() => {
                return htmlAreaForm.typeTextInHtmlArea("test");
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnFormatDropDownHandle();
            }).then(() => {
                return htmlAreaForm.selectFormatOption('Heading 1');
            }).then(() => {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result => {
                studioUtils.saveScreenshot('heading_1_cke');
                assert.equal(result[0], "<h1>test</h1>", 'expected text should be in area');
            });
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN 'Table' menu item has been clicked THEN drop down menu with table should appear`,
        () => {
            let htmlAreaForm = new HtmlAreaForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1').then(() => {
                return htmlAreaForm.pause(1000);
            }).then(() => {
                return htmlAreaForm.showToolbarAndClickOnTableButton();
            }).then(() => {
                return htmlAreaForm.isTableDropDownMenuVisible();
            }).then(result => {
                studioUtils.saveScreenshot('table_drop_down_menu_cke');
                assert.isTrue(result, 'drop down menu with table should appears');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});