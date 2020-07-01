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
    toolbox: `//span[contains(@id,'cke_1_toolbox')]`,
};

class TextComponent extends Page {

    get insertTableButton() {
        return component.toolbox + `//a[contains(@class,'cke_button') and @title='Table']`;
    }

    get insertLinkButton() {
        return component.toolbox + `//a[contains(@class,'cke_button') and contains(@title,'Link')]`;
    }

    get insertAnchorButton() {
        return component.toolbox + `//a[contains(@class,'cke_button') and contains(@title,'Anchor')]`;
    }

    get insertImageButton() {
        return component.toolbox + `//a[contains(@class,'cke_button') and contains(@title,'Image')]`;
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
            this.saveScreenshot('err_insert_link_cke');
            throw new Error('Text Component - Error when clicking on Insert Link button');
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
        let insertImageDialog = new InsertImageDialog();
        await this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.mediumTimeout);
        await this.clickOnElement(this.insertImageButton);
        await this.switchToParentFrame();
        return await insertImageDialog.waitForDialogVisible();
    }
};
module.exports = TextComponent;
