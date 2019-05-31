/**
 * Created  on 6/29/2017.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ConfirmationDialog')]`,
    yesButton: `//button[contains(@id,'DialogButton') and child::span[text()='Yes']]`,
    noButton: `//div[@class='dialog-buttons']//button/span[text()='No']`
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

    async clickOnYesButton() {
        await this.waitForElementDisplayed(this.yesButton, appConst.TIMEOUT_2);
        await this.clickOnElement(this.yesButton);
        await this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2)
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err => {
            return false;
        })
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2);
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
};
module.exports = ConfirmationDialog;
