const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const HtmlAreaForm = require('./htmlarea.form.panel');


const xpath = {
    container: `//div[contains(@id,'FullscreenDialog')]`,
};

class HtmlFullScreenDialog extends Page {

    get cancelButtonTop() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    get boldButton() {
        return xpath.container + lib.CKE.boldButton;
    }

    get italicButton() {
        return xpath.container + lib.CKE.italicButton;
    }

    get underlineButton() {
        return xpath.container + lib.CKE.underlineButton;
    }

    get justifyButton() {
        return xpath.container + lib.CKE.justifyButton;
    }

    get alignRightButton() {
        return xpath.container + lib.CKE.alignRightButton;
    }

    get alignLeftButton() {
        return xpath.container + lib.CKE.alignLeftButton;
    }

    get fullScreenButton() {
        return xpath.container + lib.CKE.fullScreen;
    }

    get insertRemoveBulletedListButton() {
        return xpath.container + lib.CKE.bulletedButton;
    }

    get insertRemoveNumberedListButton() {
        return xpath.container + lib.CKE.numberedButton;
    }

    get decreaseIndentButton() {
        return xpath.container + lib.CKE.decreaseIndentButton;
    }

    get increaseIndentButton() {
        return xpath.container + lib.CKE.increaseIndentButton;
    }

    get centerButton() {
        return xpath.container + lib.CKE.centerButton;
    }

    get insertSpecialCharacterButton() {
        return xpath.container + lib.CKE.insertSpecialCharacter;
    }

    get insertImageButton() {
        return xpath.container + lib.CKE.insertImageButton;
    }

    get insertAnchorButton() {
        return xpath.container + lib.CKE.insertAnchorButton;
    }

    get findAndReplaceButton() {
        return xpath.container + lib.CKE.findAndReplaceButton;
    }

    get insertLinkButton() {
        return xpath.container + lib.CKE.insertLinkButton;
    }

    get unlinkButton() {
        return xpath.container + lib.CKE.unlinkButton
    }

    get insertTableButton() {
        return xpath.container + lib.CKE.insertTableButton;
    }

    get pasteModeButton() {
        return xpath.container + lib.CKE.pasteModeButton;
    }

    get sourceButton() {
        return xpath.container + lib.CKE.sourceButton;
    }

    get insertMacroButton() {
        return xpath.container + lib.CKE.insertMacroButton;
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButtonTop);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_open_full_screen_dialog');
            throw new Error('Full Screen Dialog must be opened!' + err);
        });
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Full Screen dialog should be closed!: " + err);
        }
    }

    typeTextInHtmlArea(text) {
        let htmlAreaForm = new HtmlAreaForm(xpath.container);
        return htmlAreaForm.typeTextInHtmlArea(text);
    }

    getTextFromHtmlArea() {
        let htmlArea = new HtmlAreaForm(xpath.container);
        return htmlArea.getTextFromHtmlArea();
    }

    async waitForDecreaseIndentButtonDisplayed() {
        return await this.waitForElementDisplayed(this.decreaseIndentButton(), appConst.mediumTimeout);
    }

    async waitForIncreaseIndentButtonDisplayed() {
        return await this.waitForElementDisplayed(this.increaseIndentButton(), appConst.mediumTimeout);
    }

    waitForBoldButtonDisplayed() {
        return this.waitForElementDisplayed(this.boldButton, appConst.mediumTimeout);
    }

    waitForItalicButtonDisplayed() {
        return this.waitForElementDisplayed(this.italicButton, appConst.mediumTimeout);
    }

    waitForUnderlineButtonDisplayed() {
        return this.waitForElementDisplayed(this.underlineButton, appConst.mediumTimeout);
    }

    waitForJustifyButtonDisplayed() {
        return this.waitForElementDisplayed(this.justifyButton, appConst.mediumTimeout);
    }

    waitForUnderlineButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.underlineButton, appConst.mediumTimeout);
    }

    async waitForDecreaseIndentButtonDisabled() {
        await this.getBrowser().waitUntil(async () => {
            let attrClass = await this.getAttribute(this.decreaseIndentButton, 'class');
            return attrClass.includes('cke_button_disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Increase Indent button should be disabled "});
    }

    async waitForDecreaseIndentButtonEnabled() {
        await this.getBrowser().waitUntil(async () => {
            let attrClass = await this.getAttribute(this.decreaseIndentButton, 'class');
            return !attrClass.includes('cke_button_disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Increase Indent button should be enabled "});
    }

    waitForIncreaseIndentButtonEnabled() {
        return this.waitForElementEnabled(this.increaseIndentButton, appConst.mediumTimeout);
    }

    waitForIncreaseIndentButtonDisabled() {
        return this.waitForElementDisabled(this.increaseIndentButton, appConst.mediumTimeout);
    }

    waitForAlignLeftButtonDisplayed() {
        return this.waitForElementDisplayed(this.alignLeftButton, appConst.mediumTimeout);
    }

    waitForInsertRemoveBulletedListButtonEnabled() {
        return this.waitForElementEnabled(this.insertRemoveBulletedListButton, appConst.mediumTimeout);
    }

    waitForInsertRemoveNumberedListButtonEnabled() {
        return this.waitForElementEnabled(this.insertRemoveNumberedListButton, appConst.mediumTimeout);
    }

    waitForAlignRightButtonDisplayed() {
        return this.waitForElementDisplayed(this.alignRightButton, appConst.mediumTimeout);
    }

    waitForAlignCenterButtonDisplayed() {
        return this.waitForElementDisplayed(this.centerButton, appConst.mediumTimeout);
    }

    waitForInsertTableButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertTableButton, appConst.mediumTimeout);
    }

    waitForPasteModeButtonDisplayed() {
        return this.waitForElementDisplayed(this.pasteModeButton, appConst.mediumTimeout);
    }

    waitForSourceButtonDisplayed() {
        return this.waitForElementDisplayed(this.sourceButton, appConst.mediumTimeout);
    }

    waitForFullScreenButtonDisplayed() {
        return this.waitForElementDisplayed(this.fullScreenButton, appConst.mediumTimeout);
    }

    waitForInsertAnchorButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertAnchorButton, appConst.mediumTimeout);
    }

    waitForFindAndReplaceButtonDisplayed() {
        return this.waitForElementDisplayed(this.findAndReplaceButton, appConst.mediumTimeout);
    }

    waitForFindAndReplaceButtonEnabled() {
        return this.waitForElementEnabled(this.findAndReplaceButton, appConst.mediumTimeout);
    }

    waitForSpecialCharactersButtonEnabled() {
        return this.waitForElementEnabled(this.insertSpecialCharacterButton, appConst.mediumTimeout);
    }

    waitForInsertImageButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertImageButton, appConst.mediumTimeout);
    }

    waitForInsertMacroButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertMacroButton, appConst.mediumTimeout);
    }

    waitForInsertLinkButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertLinkButton, appConst.mediumTimeout);
    }

    waitForUnlinkButtonDisplayed() {
        return this.waitForElementDisplayed(this.unlinkButton, appConst.mediumTimeout);
    }

    async getNumberOfToolbarButtons() {
        let locator = xpath.container + "//a[contains(@class,'cke_button')]";
        let result = await this.getDisplayedElements(locator);
        return result.length;
    }

    clickOnIncreaseIndentButton() {
        return this.clickOnElement(this.increaseIndentButton);
    }
}

module.exports = HtmlFullScreenDialog;

