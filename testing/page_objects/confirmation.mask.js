/**
 * Created  on 24/12/2020.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ConfirmationMask')]`,
    cancelButton: "//button[contains(@id,'ActionButton') and descendant::span[text()='Cancel']]",
    confirmButton: `//button[contains(@id,'ActionButton') and descendant::span[text()='Delete My Item-set']]`,
    confirmButtonByText:
        text => `//button[contains(@id,'ActionButton') and descendant::span[text()='${text}']]`
};

class ConfirmationMask extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout);
        await this.clickOnElement(this.cancelButton);
        return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
    }

    async clickOnConfirmButton(text) {
        let locatorConfirm = XPATH.confirmButtonByText(text);
        await this.waitForElementDisplayed(locatorConfirm, appConst.shortTimeout);
        await this.clickOnElement(locatorConfirm);
        return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            throw new Error("Confirmation mask dialog is not loaded! " + err);
        })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }
}

module.exports = ConfirmationMask;
