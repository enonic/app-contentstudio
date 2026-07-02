const Page = require('../page');
const {COMMON, BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const HtmlAreaForm = require('./htmlarea.form.panel');


const xpath = {
    container: `//div[@data-component='FullscreenDialog']`,
};

class HtmlFullScreenDialog extends Page {

    get cancelButtonTop() {
        return xpath.container + BUTTONS.buttonAriaLabel('Close');
    }

    get boldButton() {
        return xpath.container + COMMON.CKE.boldButton;
    }

    get italicButton() {
        return xpath.container + COMMON.CKE.italicButton;
    }

    get underlineButton() {
        return xpath.container + COMMON.CKE.underlineButton;
    }

    get justifyButton() {
        return xpath.container + COMMON.CKE.justifyButton;
    }

    get alignRightButton() {
        return xpath.container + COMMON.CKE.alignRightButton;
    }

    get alignLeftButton() {
        return xpath.container + COMMON.CKE.alignLeftButton;
    }

    get fullScreenButton() {
        return xpath.container + COMMON.CKE.fullScreen;
    }

    get insertRemoveBulletedListButton() {
        return xpath.container + COMMON.CKE.bulletedButton;
    }

    get insertRemoveNumberedListButton() {
        return xpath.container + COMMON.CKE.numberedButton;
    }

    get decreaseIndentButton() {
        return xpath.container + COMMON.CKE.decreaseIndentButton;
    }

    get increaseIndentButton() {
        return xpath.container + COMMON.CKE.increaseIndentButton;
    }

    get centerButton() {
        return xpath.container + COMMON.CKE.centerButton;
    }

    get insertSpecialCharacterButton() {
        return xpath.container + COMMON.CKE.insertSpecialCharacter;
    }

    get insertImageButton() {
        return xpath.container + COMMON.CKE.insertImageButton;
    }

    get insertAnchorButton() {
        return xpath.container + COMMON.CKE.insertAnchorButton;
    }

    get findAndReplaceButton() {
        return xpath.container + COMMON.CKE.findAndReplaceButton;
    }

    get insertLinkButton() {
        return xpath.container + COMMON.CKE.insertLinkButton;
    }

    get unlinkButton() {
        return xpath.container + COMMON.CKE.unlinkButton
    }

    get insertTableButton() {
        return xpath.container + COMMON.CKE.insertTableButton;
    }

    get pasteModeButton() {
        return xpath.container + COMMON.CKE.pasteModeButton;
    }

    get sourceButton() {
        return xpath.container + COMMON.CKE.sourceButton;
    }

    get insertMacroButton() {
        return xpath.container + COMMON.CKE.insertMacroButton;
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
        let htmlArea = new HtmlAreaForm();
        return htmlArea.getTextFromHtmlArea();
    }

    async waitForDecreaseIndentButtonDisplayed() {
        return await this.waitForElementDisplayed(this.decreaseIndentButton());
    }

    async waitForIncreaseIndentButtonDisplayed() {
        return await this.waitForElementDisplayed(this.increaseIndentButton());
    }

    waitForBoldButtonDisplayed() {
        return this.waitForElementDisplayed(this.boldButton);
    }

    waitForItalicButtonDisplayed() {
        return this.waitForElementDisplayed(this.italicButton);
    }

    waitForUnderlineButtonDisplayed() {
        return this.waitForElementDisplayed(this.underlineButton);
    }

    waitForJustifyButtonDisplayed() {
        return this.waitForElementDisplayed(this.justifyButton);
    }

    waitForUnderlineButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.underlineButton);
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
        return this.waitForElementEnabled(this.increaseIndentButton);
    }

    waitForIncreaseIndentButtonDisabled() {
        return this.waitForElementDisabled(this.increaseIndentButton);
    }

    waitForAlignLeftButtonDisplayed() {
        return this.waitForElementDisplayed(this.alignLeftButton);
    }

    waitForInsertRemoveBulletedListButtonEnabled() {
        return this.waitForElementEnabled(this.insertRemoveBulletedListButton);
    }

    waitForInsertRemoveNumberedListButtonEnabled() {
        return this.waitForElementEnabled(this.insertRemoveNumberedListButton);
    }

    waitForAlignRightButtonDisplayed() {
        return this.waitForElementDisplayed(this.alignRightButton);
    }

    waitForAlignCenterButtonDisplayed() {
        return this.waitForElementDisplayed(this.centerButton);
    }

    waitForInsertTableButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertTableButton);
    }

    waitForPasteModeButtonDisplayed() {
        return this.waitForElementDisplayed(this.pasteModeButton);
    }

    waitForSourceButtonDisplayed() {
        return this.waitForElementDisplayed(this.sourceButton);
    }

    waitForFullScreenButtonDisplayed() {
        return this.waitForElementDisplayed(this.fullScreenButton);
    }

    waitForInsertAnchorButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertAnchorButton);
    }

    waitForFindAndReplaceButtonDisplayed() {
        return this.waitForElementDisplayed(this.findAndReplaceButton);
    }

    waitForFindAndReplaceButtonEnabled() {
        return this.waitForElementEnabled(this.findAndReplaceButton);
    }

    waitForSpecialCharactersButtonEnabled() {
        return this.waitForElementEnabled(this.insertSpecialCharacterButton);
    }

    waitForInsertImageButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertImageButton);
    }

    waitForInsertMacroButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertMacroButton);
    }

    waitForInsertLinkButtonDisplayed() {
        return this.waitForElementDisplayed(this.insertLinkButton);
    }

    waitForUnlinkButtonDisplayed() {
        return this.waitForElementDisplayed(this.unlinkButton);
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

