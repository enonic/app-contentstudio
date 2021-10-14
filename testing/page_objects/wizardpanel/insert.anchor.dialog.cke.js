const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'AnchorModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

class InsertAnchorModalDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get insertButton() {
        return `${XPATH.container}` + `${XPATH.insertButton}`;
    }

    get textInput() {
        return XPATH.container + lib.TEXT_INPUT;
    }

    typeInTextInput(text) {
        return this.typeTextInInput(this.textInput, text).catch(err => {
            this.saveScreenshot('err_insert_anchor', err);
            throw new Error("Insert Anchor Dialog - " + err);
        })
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnInsertButton() {
        await this.clickOnElement(this.insertButton);
        return await this.pause(500);
    }

    clickOnInsertButtonAndWaitForClosed() {
        return this.clickOnElement(this.insertButton).catch((err) => {
            this.saveScreenshot('err_click_on_insert_anchor_icon');
            throw new Error('Insert Anchor Dialog, error when click on the Insert button  ' + err);
        }).then(() => {
            return this.waitForDialogClosed(appConst.mediumTimeout);
        }).catch(err => {
            throw new Error('Insert Anchor Dialog, is not closed in   ' + appConst.mediumTimeout + "   " + err);
        })
    }

    waitForValidationMessage() {
        return this.waitForElementDisplayed(XPATH.container + lib.VALIDATION_RECORDING_VIEWER, appConst.shortTimeout).catch(err => {
            return false;
        });
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_anchor_dialog');
            throw new Error('Insert Anchor Dialog should be opened!' + err);
        });
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }
}
module.exports = InsertAnchorModalDialog;

