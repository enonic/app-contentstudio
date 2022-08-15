const Page = require('../page');
const lib = require('../../libs/elements');
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


    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    clickOnOkButton() {
        return this.clickOnElement(this.okButton).catch(err => {
            this.saveScreenshot('err_source_dlg_clicking_ok');
            throw new Error('Source Code Dialog, error when click on the `OK` button  ' + err);
        }).then(() => {
            return this.waitForDialogClosed();
        })
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_source_code_dialog');
            throw new Error('Source Code Dialog must be opened!' + err);
        });
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
}

module.exports = HtmlSourceCodeDialog;

