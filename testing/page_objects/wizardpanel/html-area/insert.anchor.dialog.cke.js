const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

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

    async typeInTextInput(text) {
        try {
            return await this.typeTextInInput(this.textInput, text)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_insert_anchor');
            throw new Error("Insert Anchor Dialog -screenshot:  " + screenshot + ' ' + err);
        }
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
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
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_insert_anchor_icon');
            throw new Error('Insert Anchor Dialog, screenshot:  ' + screenshot + "   " + err);
        }
    }

    async waitForValidationMessage() {
        try {
            let locator = XPATH.container + lib.VALIDATION_RECORDING_VIEWER;
            return await this.waitForElementDisplayed(locator, appConst.shortTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_insert_anchor_icon');
            throw new Error('Insert Anchor dialog, validation message should be displayed! screenshot: ' + screenshot + '' + err);
        }
    }

    async getValidationMessage() {
        let locator = XPATH.container + lib.VALIDATION_RECORDING_VIEWER;
        await this.waitForValidationMessage();
        return await this.getText(locator);
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

