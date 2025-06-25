/**
 * Created  on 6/29/2017.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements-old');
const XPATH = {
    container: `//div[contains(@id,'ConfirmationDialog')]`,
    yesButton: `//button[contains(@id,'DialogButton') and descendant::u[text()='Y'] and child::span[text()='es']]`,
    noButton: `//button[contains(@id,'DialogButton') and descendant::u[text()='N'] and child::span[text()='o']]`,
    question: "//h6[@class='question']",
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
        try {
            await this.waitForElementDisplayed(this.yesButton, appConst.shortTimeout);
            await this.clickOnElement(this.yesButton);
            await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
            await this.pause(300);
        } catch (err) {
            await this.handleError('Confirmation dialog Yes button', 'err_confirmation_dlg_yes', err);
        }
    }

    async clickOnCancelTopButton() {
        await this.waitForElementDisplayed(this.cancelTopButton, appConst.shortTimeout);
        await this.clickOnElement(this.cancelTopButton);
        await this.waitForDialogClosed();
        return await this.pause(appConst.TIMEOUT_1);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            await this.pause(700);
        } catch (err) {
            await this.handleError('Confirmation dialog', 'err_confirmation_dlg_opened', err);
        }
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
            return await this.pause(400);
        } catch (err) {
            await this.handleError('Confirmation dialog should be closed', 'err_confirmation_dlg_closed', err);
        }
    }

    isWarningMessageVisible() {
        return this.isElementDisplayed(this.warningMessage);
    }

    getWarningMessage() {
        return this.getText(this.warningMessage);
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton);
    }

    async getQuestion() {
        await this.waitForElementDisplayed(XPATH.container + XPATH.question);
        return await this.getText(XPATH.container + XPATH.question)
    }
}

module.exports = ConfirmationDialog;
