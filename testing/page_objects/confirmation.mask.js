/**
 * Created  on 24/12/2020.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ConfirmationMask')]`,
    cancelButton: "//button[contains(@id,'ActionButton') and descendant::span[text()='Cancel']]",
    confirmButton: `//button[contains(@id,'ActionButton') and descendant::span[text()='Delete My Item-set']]`,
};

class ConfirmationMask extends Page {


    get confirmButton() {
        return XPATH.container + XPATH.confirmButton;
    }

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout);
        await this.clickOnElement(this.cancelButton);
        return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
    }

    async clickOnConfirmButton() {
        await this.waitForElementDisplayed(this.confirmButton, appConst.shortTimeout);
        await this.clickOnElement(this.confirmButton);
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
