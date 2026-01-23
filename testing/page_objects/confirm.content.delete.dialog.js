/**
 * Created  on 20/01/2018
 */
const Page = require('./page');
const {BUTTONS} = require('../libs/elements');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[@role='dialog' and descendant::h2[contains(.,'Confirm delete')  or contains(., 'Confirm archive')]]`,
    confirmButton: `//button[contains(@id,'DialogButton') and child::span[text()='Confirm']]`,
    cancelButton: `//div[@class='dialog-buttons']//button/span[text()='Cancel']`,
    suggestedNumberToDelete: "//span[contains(@class,'confirm-value-data')]",

};

class ConfirmValueDialog extends Page {

    get warningMessage() {
        return XPATH.container +
               `//div[contains(@id,'ModalDialogHeader')]//h6[text()='You are about to delete a site or multiple content items. This action cannot be undone.']`;
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Cancel');
    }

    get confirmButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Confirm');
    }

    get numberInput() {
        return XPATH.container + "//input[@inputmode='numeric']";
    }

    async getDialogTitle() {
        let locator = XPATH.container + "//h2";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Confirm Value Dialog should be loaded', 'err_confirm_value_dlg_opened', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Confirm Value Dialog should be closed', 'err_confirm_value_dlg_closed', err);
        }
    }

    async waitForConfirmButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.confirmButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Confirm Value Dialog - Confirm button', 'err_confirm_value_dlg_confirm_button', err);
        }
    }

    async waitForConfirmButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.confirmButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Confirm Value Dialog - Confirm button', 'err_confirm_value_dlg_confirm_button', err);
        }
    }

    waitForCancelButtonEnabled() {
        return this.waitForElementEnabled(this.cancelButton, appConst.mediumTimeout).catch(err => {
            throw new Error("Confirm Value Dialog - Cancel button is not enabled in " + err);
        })
    }

    isWarningMessageVisible() {
        return this.isElementDisplayed(this.warningMessage);
    }

    getWarningMessage() {
        return this.getText(this.warningMessage);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnConfirmButton() {
        try {
            await this.waitForElementEnabled(this.confirmButton, appConst.mediumTimeout);
            await this.clickOnElement(this.confirmButton);
            //modal dialog closes:
            await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Confirm Value dialog - Confirm button', 'err_confirm_value_dlg_confirm_button', err);
        }
    }

    typeNumberOrName(number) {
        return this.typeTextInInput(this.numberInput, number);
    }

    getSuggestedNumberToDelete() {
        const locator = XPATH.container + XPATH.suggestedNumberToDelete;
        return this.getText(locator);
    }
}

module.exports = ConfirmValueDialog;
