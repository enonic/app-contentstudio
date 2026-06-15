const Page = require('../../page');
const lib = require('../../../libs/elements-old');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='AnchorDialog']`,
    insertButton: `//button[@aria-label='Insert']`,
    cancelButton: `//button[@data-area='close']`,
};

class InsertAnchorModalDialog extends Page {

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get insertButton() {
        return XPATH.container + XPATH.insertButton;
    }

    get textInput() {
        return XPATH.container + "//div[@data-component='Input']//input";
    }

    async typeInTextInput(text) {
        try {
            return await this.typeTextInInput(this.textInput, text)
        } catch (err) {
            await this.handleError(`Insert Anchor Dialog`, 'err_insert_anchor_text_input', err);
        }
    }

    clickOnCloseButton() {
        return this.clickOnElement(this.closeButton);
    }

    async clickOnInsertButton() {
        await this.clickOnElement(this.insertButton);
        return await this.pause(500);
    }

    async clickOnInsertButtonAndWaitForClosed() {
        try {
            await this.clickOnElement(this.insertButton);
            return await this.waitForDialogClosed(appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Insert Anchor Dialog`, 'err_click_on_insert_anchor_icon', err);
        }
    }

    async waitForValidationMessage() {
        try {
            let locator = XPATH.container + "//div[contains(@class,'text-error')]";
            return await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`Insert Anchor Dialog`, 'err_wait_for_validation_message', err);
        }
    }

    async getValidationMessage() {
        let locator = XPATH.container + "//div[contains(@class,'text-error')]";
        await this.waitForValidationMessage();
        return await this.getText(locator);
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`Insert Anchor Dialog should be opened!`, 'err_insert_anchor_dialog_loaded', err);
        }
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }
}

module.exports = InsertAnchorModalDialog;

