/**
 * Created  on 6/29/2017.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ConfirmationDialog')]`,
    yesButton: `//button[contains(@id,'DialogButton') and descendant::u[text()='Y'] and child::span[text()='es']]`,
    noButton: `//button[contains(@id,'DialogButton') and descendant::u[text()='N'] and child::span[text()='o']]`,
};

class ConfirmationDialog extends Page {

    get warningMessage() {
        return XPATH.container + "//h6[@class='question']";
    }

    get yesButton() {
        return XPATH.container + XPATH.yesButton;
    }

    get noButton() {
        return XPATH.container + XPATH.noButton;
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    async clickOnYesButton() {
        await this.waitForElementDisplayed(this.yesButton, appConst.shortTimeout);
        await this.clickOnElement(this.yesButton);
        return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
    }

    async clickOnCancelTopButton() {
        await this.waitForElementDisplayed(this.cancelTopButton, appConst.shortTimeout);
        await this.clickOnElement(this.cancelTopButton);
        return await this.waitForDialogClosed();
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("Confirmation dialog is not loaded! " + err);
        })
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    isWarningMessageVisible() {
        return this.isElementDisplayed(this.warningMessage);
    }

    getWarningMessage() {
        return this.getText(this.warningMessage)
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton);
    }
}
module.exports = ConfirmationDialog;
