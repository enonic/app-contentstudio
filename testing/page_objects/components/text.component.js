/**
 * Created on 10.05.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const utils = require('../../libs/studio.utils');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const InsertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');

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

    typeTextInCkeEditor(text) {
        return this.switchToLiveEditFrame().then(() => {
            return this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.TIMEOUT_3);
        }).then(() => {
            return this.getIdOfEditor();
        }).then(id => {
            return utils.setTextInCKE(id, text);
        }).then(() => {
            return this.getBrowser().switchToParentFrame();
        }).then(() => {
            return this.pause(1000);
        })
    }

    getTextFromEditor() {
        let strings = [];
        return this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(() => {
            return this.getIdOfEditor();
        }).then(id => {
            return utils.getTextInCKE(id);
        }).then(result => {
            return result.trim();
        });
    }

    getIdOfEditor() {
        return this.getAttribute(lib.RICH_TEXT_EDITOR, 'id');
    }

    switchToLiveEditFrame() {
        return this.switchToFrame("//iframe[contains(@class,'live-edit-frame shown')]");
    }

    async

    switchToCKETableFrameAndInsertTable() {
        await
        this.waitForElementDisplayed("//iframe[contains(@class,'cke_panel_frame')]", appConst.TIMEOUT_2);
        await
        this.switchToFrame("//iframe[contains(@class,'cke_panel_frame')]");
        await
        this.clickOnElement("//div[contains(@class,'cke_panel_block')]");
        await
        this.getBrowser().switchToParentFrame();
    }

    async

    waitForTableDisplayedInCke() {
        await
        this.waitForElementDisplayed("//iframe[contains(@class,'cke_panel_frame')]", appConst.TIMEOUT_2);
        await
        this.switchToFrame("//iframe[contains(@class,'cke_panel_frame')]");
        let table = "//table";
        let result = await
        this.waitForElementDisplayed(table, appConst.TIMEOUT_2);
        await
        this.getBrowser().switchToParentFrame();
        return result;
    }

    clickOnInsertTableButton() {
        return this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(result => {
            return this.clickOnElement(this.insertTableButton);
        }).then(() => {
            console.log('Insert Table dialog');
            //TODO finish it when bug with Table will be fixed
            //return insertTableDialog.waotForVisible();
        });
    }

    clickOnInsertLinkButton() {
        let insertLinkDialog = new InsertLinkDialog();
        return this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_text_component_open_cke');
            throw new Error('Text Component - rich editor is not focused!');
        }).then(result => {
            return this.clickOnElement(this.insertLinkButton);
        }).then(() => {
            return this.switchToParentFrame();
        }).then(() => {
            return insertLinkDialog.waitForDialogLoaded();
        });
    }

    clickOnInsertAnchorButton() {
        let insertAnchorDialog = new InsertAnchorDialog();
        return this.waitForElementDisplayed(lib.RICH_TEXT_EDITOR, appConst.TIMEOUT_3).then(result => {
            return this.clickOnElement(this.insertAnchorButton);
        }).then(() => {
            return this.switchToParentFrame();
        }).then(() => {
            return insertAnchorDialog.waitForDialogLoaded();
        });
    }
};
module.exports = TextComponent;


