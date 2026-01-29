/**
 * Created  on 6/29/2017.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const {BUTTONS} = require('../libs/elements');
const XPATH = {
    container: `//div[@role='dialog' and @data-component='DialogPresetConfirm']`,
    question: "//h6[@class='question']",
};

class ConfirmationDialog extends Page {

    get warningMessage() {
        return XPATH.container + "//h6[@class='question']";
    }

    get confirmButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Confirm');
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Cancel');
    }

    async clickOnConfirmButton() {
        try {
            await this.waitForElementDisplayed(this.confirmButton, appConst.shortTimeout);
            await this.clickOnElement(this.confirmButton);
            await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
            await this.pause(100);
        } catch (err) {
            await this.handleError('Confirmation dialog, Confirm button has been clicked', 'err_confirmation_dlg_confirm', err);
        }
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            await this.pause(200);
        } catch (err) {
            await this.handleError('Confirmation dialog should be loaded', 'err_confirmation_dlg_opened', err);
        }
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
            return await this.pause(200);
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

    async clickOnCancelButton() {
        return await this.clickOnElement(this.cancelButton);
    }

    async getQuestion() {
        await this.waitForElementDisplayed(XPATH.container + XPATH.question);
        return await this.getText(XPATH.container + XPATH.question)
    }
}

module.exports = ConfirmationDialog;
