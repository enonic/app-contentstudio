const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'UninstallApplicationDialog')]`,
    dialogQuestion: `//div[contains(@id,'ModalDialogContentPanel')]/h6`,
    yesButton: `//button[contains(@id,'DialogButton')]/span[text()='Yes']`,
    noButton: `//button[contains(@id,'DialogButton')]/span[text()='No']`,
};

class UninstallAppDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get yesButton() {
        return XPATH.container + XPATH.yesButton;
    }

    get noButton() {
        return XPATH.container + XPATH.noButton;
    }

    async getQuestion() {
        let result = await this.findElements(XPATH.dialogQuestion);
        await this.waitForElementDisplayed(XPATH.dialogQuestion, appConst.mediumTimeout);
        return await this.getText(XPATH.dialogQuestion);
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Uninstall dialog was not loaded!', 'err_open_uninstall_dialog', err);
        }
    }

    async clickOnYesButton() {
        await this.waitForElementDisplayed(this.yesButton, appConst.mediumTimeout);
        await this.clickOnElement(this.yesButton);
    }

    async clickOnCancelButtonTop() {
        try {
            await this.clickOnElement(this.cancelButtonTop)
        } catch (err) {
            await this.handleError('Cancel top button has been clicked', 'err_uninstall_dialog_cancel', err);
        }
    }

    clickOnNoButton() {
        return this.clickOnElement(this.noButton).catch(err => {
            throw new Error("Error when click on 'No' button " + err);
        })
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            await this.clickOnCancelButtonTop();
            await this.handleError('Uninstall Dialog was not closed', 'err_close_uninstall_dialog', err);
        }
    }

    async waitForYesButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.yesButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Uninstall Dialog - Yes button is not visible', 'err_uninstall_dialog_yes_button', err);
        }
    }

    async waitForNoButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.noButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Uninstall Dialog -  No button is not visible', 'err_uninstall_dialog_no_button', err);
        }
    }
}

module.exports = UninstallAppDialog;
