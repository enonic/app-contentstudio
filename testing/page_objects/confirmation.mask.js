/**
 * Created  on 24/12/2020.
 */
const Page = require('./page');
const {BUTTONS} = require('../libs/elements');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@class,'fixed') and contains(@class,'z-40') and child::button[@aria-label='Cancel'] and child::button[@aria-label='Delete']]`,
};

class ConfirmationMask extends Page {

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel("Cancel");
    }

    get deleteButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel("Delete");
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout);
        await this.clickOnElement(this.cancelButton);
        return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout)
    }

    async clickOnDeleteButton(text) {
        await this.waitForElementDisplayed(this.deleteButton, appConst.shortTimeout);
        await this.clickOnElement(this.deleteButton);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Confirmation mask dialog is not loaded! " + err);
        }
    }

    async waitForDialogClosed() {
        return await  this.waitForElementNotDisplayed(this.deleteButton, appConst.shortTimeout);
    }

    isDialogVisible() {
        return this.isElementDisplayed(XPATH.container);
    }
}

module.exports = ConfirmationMask;
