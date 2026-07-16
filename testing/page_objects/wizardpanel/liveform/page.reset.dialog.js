/**
 * Created  on 16.07.2026
 */
const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const XPATH = {
    container: `//div[@data-component='PageResetDialog']`,
};

class PageResetDialog extends Page {

    get warningMessage() {
        return XPATH.container + "//div[@data-component='Dialog.Body']";
    }

    get confirmButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Confirm');
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Cancel');
    }

    async clickOnConfirmButton() {
        try {
            await this.waitForElementDisplayed(this.confirmButton);
            await this.clickOnElement(this.confirmButton);
            await this.pause(100);
        } catch (err) {
            await this.handleError('Confirmation dialog, Confirm button has been clicked', 'err_confirmation_dlg_confirm', err);
        }
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
            await this.pause(200);
        } catch (err) {
            await this.handleError('Confirmation dialog should be loaded', 'err_confirmation_dlg_opened', err);
        }
    }

    async isDialogVisible() {
        return await this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Page Reset dialog should be closed', 'err_confirmation_dlg_closed', err);
        }
    }

    async getWarningMessage() {
        return await this.getText(this.warningMessage);
    }

    async clickOnCancelButton() {
        await this.clickOnElement(this.cancelButton);
    }

    async getQuestion() {
        let locator = XPATH.container + "//div[@data-component='Dialog.Body']";
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }
}

module.exports = PageResetDialog;
