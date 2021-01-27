const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'MacroModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

class InsertMacroModalDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return `${XPATH.container}` + `${lib.CANCEL_BUTTON_TOP}`;
    }

    get insertButton() {
        return XPATH.container + XPATH.insertButton;
    }

    get textInput() {
        return XPATH.container + lib.TEXT_INPUT;
    }

    typeInTextInput(text) {
        return this.typeTextInInput(this.textInput, text).catch(err => {
            this.saveScreenshot('err_insert_macro');
            throw new Error(err);
        })
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    clickOnInsertButton() {
        return this.clickOnElement(this.insertButton).catch((err) => {
            this.saveScreenshot('err_click_on_insert_macro_button');
            throw new Error('Insert Image Dialog, error when click on the Insert button  ' + err);
        }).then(() => {
            return this.waitForDialogClosed();
        })
    }

    waitForDialogVisible() {
        return this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_macro_dialog');
            throw new Error('Insert Image Dialog should be opened!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }
};
module.exports = InsertMacroModalDialog;