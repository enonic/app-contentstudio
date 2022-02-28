/**
 * Created on 10.05.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const InsertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');

const component = {
    toolbox: `//span[contains(@class,'cke_toolbox')]`,
};

class TextComponent extends Page {

    get insertTableButton() {
        return component.toolbox + lib.CKE.insertTableButton;
    }

    get insertLinkButton() {
        return component.toolbox + lib.CKE.insertLinkButton;
    }

    get insertAnchorButton() {
        return component.toolbox + lib.CKE.insertAnchorButton;
    }

    get insertImageButton() {
        return component.toolbox + lib.CKE.insertImageButton;
    }

    get boldButton() {
        return component.toolbox + lib.CKE.boldButton;
    }

    get italicButton() {
        return component.toolbox + lib.CKE.italicButton;
    }

    get underlineButton() {
        return component.toolbox + lib.CKE.underlineButton;
    }

    get justifyButton() {
        return component.toolbox + lib.CKE.justifyButton;
    }

    get alignLeftButton() {
        return component.toolbox + lib.CKE.alignLeftButton;
    }

    get alignRightButton() {
        return component.toolbox + lib.CKE.alignRightButton;
    }

    get centerButton() {
        return component.toolbox + lib.CKE.centerButton;
    }

    get decreaseIndentButton() {
        return component.toolbox + lib.CKE.decreaseIndentButton;
    }

    get increaseIndentButton() {
        return component.toolbox + lib.CKE.increaseIndentButton;
    }

    get bulletedButton() {
        return component.toolbox + lib.CKE.bulletedButton;
    }

    get insertSpecialCharacterButton() {
        return component.toolbox + lib.CKE.insertSpecialCharacter;
    }

    async typeTextInCkeEditor(text) {
        await this.switchToLiveEditFrame();
        await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
        let id = await this.getEditorId();
        await utils.setTextInCKE(id, text);
        await this.getBrowser().switchToParentFrame();
        return await this.pause(1000);
    }

    async getTextFromEditor() {
        await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
        let editorId = await this.getEditorId();
        let result = await utils.getTextInCKE(editorId);
        return result.trim();
    }

    getEditorId() {
        return this.getAttribute(lib.RICH_TEXT_EDITOR, 'id');
    }

    switchToLiveEditFrame() {
        return this.switchToFrame(lib.LIVE_EDIT_FRAME);
    }

    async switchToCKETableFrameAndInsertTable() {
        await this.waitForElementDisplayed("//iframe[contains(@class,'cke_panel_frame')]", appConst.mediumTimeout);
        await this.switchToFrame("//iframe[contains(@class,'cke_panel_frame')]");
        await this.clickOnElement("//div[contains(@class,'cke_panel_block')]");
        return await this.getBrowser().switchToParentFrame();
    }

    async waitForTableDisplayedInCke() {
        await this.waitForElementDisplayed("//iframe[contains(@class,'cke_panel_frame')]", appConst.mediumTimeout);
        await this.switchToFrame("//iframe[contains(@class,'cke_panel_frame')]");
        let table = "//table";
        let result = await this.waitForElementDisplayed(table, appConst.shortTimeout);
        await this.getBrowser().switchToParentFrame();
        return result;
    }

    async clickOnInsertTableButton() {
        console.log('Insert Table dialog');
        await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
        return await this.clickOnElement(this.insertTableButton);
    }

    async clickOnInsertLinkButton() {
        let insertLinkDialog = new InsertLinkDialog();
        try {
            await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
            await this.clickOnElement(this.insertLinkButton);
            await this.switchToParentFrame();
            return await insertLinkDialog.waitForDialogLoaded();
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_insert_link_cke'));
            throw new Error('Text Component - Error when clicking on Insert Link button' + err);
        }
    }

    async clickOnInsertAnchorButton() {
        let insertAnchorDialog = new InsertAnchorDialog();
        await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
        await this.clickOnElement(this.insertAnchorButton);
        await this.switchToParentFrame();
        return await insertAnchorDialog.waitForDialogLoaded();
    }

    async clickOnInsertImageButton() {
        try {
            let insertImageDialog = new InsertImageDialog();
            await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
            await this.clickOnElement(this.insertImageButton);
            await this.pause(500);
            await this.switchToParentFrame();
            return await insertImageDialog.waitForDialogVisible();
        } catch (err) {
            await this.switchToParentFrame();
            await this.saveScreenshot(appConst.generateRandomName("err_insert_image_button"));
            throw new Error("Text Component Toolbar - Error after clicking on Insert Image button:" + err);
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

    waitForBulletedButtonDisplayed() {
        return this.waitForElementDisplayed(this.bulletedButton, appConst.mediumTimeout);
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

module.exports = TextComponent;
