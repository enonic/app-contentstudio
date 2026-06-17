/**
 * Created on 24.12.2024
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const {COMMON} = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const utils = require('../../../../libs/studio.utils');
const InsertLinkDialog = require('../../html-area/insert.link.modal.dialog.cke');
const InsertAnchorDialog = require('../../html-area/insert.anchor.dialog.cke');
const InsertImageDialog = require('../../html-area/insert.image.dialog.cke');

const XPATH = {
    container: "//div[@data-component='TextInspectionPanel']",
    ckeTextArea: "//div[contains(@id,'cke_TextArea')]",
};

// Context Window, Text Component Inspect tab
class TextComponentInspectionPanel extends BaseComponentInspectionPanel {

    get insertImageButton() {
        return XPATH.container + COMMON.CKE.insertImageButton;
    }

    get insertTableButton() {
        return XPATH.container + COMMON.CKE.insertTableButton;
    }

    get insertMacroButton() {
        return XPATH.container + COMMON.CKE.insertMacroButton;
    }

    get boldButton() {
        return XPATH.container + COMMON.CKE.boldButton;
    }

    get italicButton() {
        return XPATH.container + COMMON.CKE.italicButton;
    }

    get underlineButton() {
        return XPATH.container + COMMON.CKE.underlineButton;
    }

    get justifyButton() {
        return XPATH.container + COMMON.CKE.justifyButton;
    }

    get alignLeftButton() {
        return XPATH.container + COMMON.CKE.alignLeftButton;
    }

    get alignRightButton() {
        return XPATH.container + COMMON.CKE.alignRightButton;
    }

    get centerButton() {
        return XPATH.container + COMMON.CKE.centerButton;
    }

    get insertLinkButton() {
        return XPATH.container + COMMON.CKE.insertLinkButton;
    }

    get insertAnchorButton() {
        return XPATH.container + COMMON.CKE.insertAnchorButton;
    }

    get sourceButton() {
        return XPATH.container + COMMON.CKE.sourceButton;
    }

    get textArea() {
        return XPATH.container + "//div[@data-component='TextEditorInner']";
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

    async setTextInEditor(text) {
        try {
            let id = await this.getIdOfTextEditor();
            await utils.setTextInCKE(id, text);
            return await this.pause(700);
        } catch (err) {
            await this.handleError('Inspect Panel with text area: ', 'err_text_component_inspect_panel', err);
        }
    }

    async getIdOfTextEditor() {
        let locator = XPATH.container + COMMON.CKE.textInspectionEditor;
        let elems = await this.findElements(locator);
        return await elems[0].getAttribute('id');
    }

    async clickInTextArea() {
        try {
            await this.waitForElementDisplayed(this.textArea, appConst.mediumTimeout);
            await this.clickOnElement(this.textArea);
            await this.pause(100);
        }catch(err){
            await this.handleError('Inspect Panel, Text Component - tried to click in text area: ', 'err_click_text_area', err);
        }
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

    async clickOnInsertTableButton() {
        try {
            await this.waitForElementDisplayed(this.insertTableButton, appConst.mediumTimeout);
            await this.clickOnElement(this.insertTableButton);
            return await this.pause(300);
        }catch (err) {
            await this.handleError('Inspect Panel, Text Component - tried to click on Insert Table button: ', 'err_insert_table_btn', err);
        }
    }
    async clickOnMoreButtonInHtmlTableFrame() {
        try {
            let locator = "//div[@role='dialog' and @aria-label='Table']//button[text()='More...']";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            await this.switchToParentFrame();
            await this.switchToParentFrame();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_more_button');
            throw new Error(`Error after clicking on More button(Insert Table), screenshot: ${screenshot}` + err);
        }
    }

    async waitForTableDisplayedInEditorFrame() {
        await this.waitForElementDisplayed("//iframe[contains(@class,'cke_panel_frame')]", appConst.mediumTimeout);
        await this.switchToFrame("//iframe[contains(@class,'cke_panel_frame')]");
        let table = "//table";
        let result = await this.waitForElementDisplayed(table, appConst.shortTimeout);
        await this.getBrowser().switchToParentFrame();
        return result;
    }


    async showToolbarAndClickOnInsertAnchorButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(COMMON.CKE.insertAnchorButton, appConst.mediumTimeout);
        await this.clickOnElement(COMMON.CKE.insertAnchorButton);
        return await this.pause(300);
    }

    async showToolbarAndClickOnInsertImageButton() {
        await this.clickInTextArea();
        await this.waitForElementDisplayed(COMMON.CKE.insertImageButton);
        await this.clickOnElement(COMMON.CKE.insertImageButton);
        return await this.pause(300);
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
