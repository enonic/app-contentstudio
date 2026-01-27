/**
 * Created on 24.12.2024
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const utils = require('../../../../libs/studio.utils');
const InsertLinkDialog = require('../../html-area/insert.link.modal.dialog.cke');
const InsertAnchorDialog = require('../../html-area/insert.anchor.dialog.cke');
const InsertImageDialog = require('../../html-area/insert.image.dialog.cke');

const XPATH = {
    container: "//div[contains(@id,'TextInspectionPanel')]",
    ckeTextArea: "//div[contains(@id,'cke_TextArea')]",
};

// Context Window, Text Component Inspect tab
class TextComponentInspectionPanel extends BaseComponentInspectionPanel {

    get insertImageButton() {
        return XPATH.container + lib.CKE.insertImageButton;
    }
    get insertMacroButton() {
        return XPATH.container + lib.CKE.insertMacroButton;
    }

    get boldButton() {
        return XPATH.container + lib.CKE.boldButton;
    }

    get italicButton() {
        return XPATH.container + lib.CKE.italicButton;
    }

    get underlineButton() {
        return XPATH.container + lib.CKE.underlineButton;
    }

    get justifyButton() {
        return XPATH.container + lib.CKE.justifyButton;
    }

    get alignLeftButton() {
        return XPATH.container + lib.CKE.alignLeftButton;
    }

    get alignRightButton() {
        return XPATH.container + lib.CKE.alignRightButton;
    }

    get centerButton() {
        return XPATH.container + lib.CKE.centerButton;
    }

    get insertLinkButton() {
        return XPATH.container + lib.CKE.insertLinkButton;
    }

    get insertAnchorButton() {
        return XPATH.container + lib.CKE.insertAnchorButton;
    }

    get sourceButton() {
        return XPATH.container + lib.CKE.sourceButton;
    }

    get textArea() {
        return XPATH.container + lib.CKE.TEXTAREA_DIV;
    }

    waitForOpened() {
        return this.waitForElementDisplayed(XPATH.container);
    }

    async typeTextInEditor(text) {
        try {
            let id = await this.getIdOfTextEditor();
            await utils.insertTextInCKE(id, text);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Inspect Panel with text area: ', 'err_text_component_inspect_panel', err);
        }
    }

    async getIdOfTextEditor() {
        let locator = XPATH.container + lib.TEXT_AREA;
        let elems = await this.findElements(locator);
        return await elems[0].getAttribute('id');
    }

    async clickInTextArea() {
        await this.waitForElementDisplayed(this.textArea, appConst.mediumTimeout);
        await this.clickOnElement(this.textArea);
        await this.pause(100);
    }

    async getTextFromEditor() {
        let id = await this.getIdOfTextEditor();
        return await utils.getTextInCKE(id);
    }

    async clickOnInsertLinkButton() {
        let insertLinkDialog = new InsertLinkDialog();
        try {
            await this.waitForElementDisplayed(this.insertLinkButton, appConst.mediumTimeout);
            await this.clickOnElement(this.insertLinkButton);
            return await insertLinkDialog.waitForDialogLoaded();
        } catch (err) {
            await this.handleError('Inspect Panel, Text Component - tried to click on Insert Link button: ', 'err_insert_link_button', err);
        }
    }

    async clickOnInsertImageButton() {
        try {
            let insertImageDialog = new InsertImageDialog();
            await this.waitForElementDisplayed(this.insertImageButton, appConst.mediumTimeout);
            let res = await this.getDisplayedElements(this.insertImageButton);
            await res[0].click();
            await this.pause(100);
            return await insertImageDialog.waitForDialogVisible();
        } catch (err) {
            await this.handleError('Inspect Panel, Text Component - tried to click on Insert Image button ', 'err_insert_image_btn', err);
        }
    }

    async clickOnSourceButton() {
        let insertLinkDialog = new InsertLinkDialog();
        try {
            await this.waitForElementDisplayed(this.sourceButton, appConst.mediumTimeout);
            await this.clickOnElement(this.sourceButton);
        } catch (err) {
            await this.handleError('Inspect Panel, Text Component - tried to click on Source button: ', 'err_insert_link_button', err);
        }
    }

    async clickOnInsertMacroButton() {
        try {
            await this.waitForElementDisplayed(this.insertMacroButton, appConst.mediumTimeout);
            await this.clickOnElement(this.insertMacroButton);
        } catch (err) {
            await this.handleError('Inspect Panel, Text Component - tried to click on Insert Macro button: ', 'err_insert_macro_btn', err);
        }
    }

    async clickOnInsertAnchorButton() {
        let insertAnchorDialog = new InsertAnchorDialog();
        await this.waitForElementDisplayed(this.insertAnchorButton, appConst.mediumTimeout);
        await this.clickOnElement(this.insertAnchorButton);
        return await insertAnchorDialog.waitForDialogLoaded();
    }

    async clickOnSourceButton() {
        try {
            await this.waitForElementDisplayed(this.sourceButton, appConst.mediumTimeout);
            await this.clickOnElement(this.sourceButton);
        } catch (err) {
            await this.handleError('Inspect Panel, Text Component - tried to click on Source button: ', 'err_source_btn', err);
        }
    }
    async waitForBoldButtonDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getDisplayedElements(this.boldButton);
            return result.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Bold button should be displayed"});
    }

    async waitForItalicButtonDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getDisplayedElements(this.italicButton);
            return result.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Italic button should be displayed"});
    }
    async waitForUnderlineButtonDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getDisplayedElements(this.underlineButton);
            return result.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Underline button should be displayed"});
    }

    waitForJustifyButtonButtonDisplayed() {
        return this.waitForElementDisplayed(this.justifyButton, appConst.mediumTimeout);
    }
}

module.exports = TextComponentInspectionPanel;
