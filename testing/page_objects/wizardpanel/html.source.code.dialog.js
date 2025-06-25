const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'CodeDialog')]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    okButton: `//button[contains(@id,'DialogButton') and child::span[text()='OK']]`,
    textArea: `//textarea[@name='source-textarea']`
};

class HtmlSourceCodeDialog extends Page {

    get cancelButton() {
        return xpath.container + xpath.cancelButton;
    }

    get okButton() {
        return xpath.container + xpath.okButton;
    }

    get cancelButtonTop() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }


    async clickOnCancelButton() {
        try {
             await this.clickOnElement(this.cancelButton);
             return await this.pause(300);
        }catch (err){
            let screenshot = await this.saveScreenshotUniqueName('err_source_dlg_click_cancel');
            throw new Error(`Source Code Dialog, error after clicking on the Cancel button, screenshot:${screenshot}  ` + err);
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
            return await this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_source_code_dialog');
            throw new Error(`Source Code Dialog must be opened! screenshot: ${screenshot}` + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(`${xpath.container}`, appConst.shortTimeout);
    }

    getText() {
        return this.getTextInInput(xpath.textArea);
    }

    typeText(text) {
        return this.typeTextInInput(xpath.textArea, text);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }
}

module.exports = HtmlSourceCodeDialog;

