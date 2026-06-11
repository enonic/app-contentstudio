/**
 * Updated on 11.06.2026
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[@data-component='CodeDialog']`,
    closeButton: `//button[@data-component='Dialog.DefaultClose']`,
    textArea: `//div[@data-component='TextArea']//textarea`,
};

class HtmlSourceCodeDialog extends Page {

    // The 'OK' button is a submit button in the dialog footer:
    get okButton() {
        return xpath.container + BUTTONS.submitButtonByLabel('OK');
    }

    // The round 'Close' button in the dialog header - closes the dialog without applying changes:
    get closeButton() {
        return xpath.container + xpath.closeButton;
    }

    // Closes the dialog without applying changes (the dialog has no separate Cancel button):
    async clickOnCancelButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
            await this.clickOnElement(this.closeButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_source_dlg_click_cancel');
            throw new Error(`Source Code Dialog, error after clicking on the Close button, screenshot:${screenshot}  ` + err);
        }
    }

    async clickOnOkButton() {
        try {
            await this.clickOnElement(this.okButton);
            await this.waitForDialogClosed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_source_dlg_click_ok');
            throw new Error(`Source Code Dialog, error when click on the OK button, screenshot:${screenshot}  ` + err);
        }
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(this.okButton, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_source_code_dialog');
            throw new Error(`Source Code Dialog must be opened! screenshot: ${screenshot}` + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(`${xpath.container}`, appConst.shortTimeout);
    }

    getText() {
        return this.getTextInInput(xpath.container + xpath.textArea);
    }

    typeText(text) {
        return this.typeTextInInput(xpath.container + xpath.textArea, text);
    }
}

module.exports = HtmlSourceCodeDialog;
