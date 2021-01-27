const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'NotificationDialog')]",
    okButton: "//button/span[contains(.,'OK')]",
};

// it appears when click on Reset menu item in Option Set.
class NotificationDialog extends Page {

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get okButton() {
        return XPATH.container + XPATH.okButton;
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(XPATH.container, appConst.shortTimeout);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_close_notification_dialog');
            throw new Error('Notification dialog dialog must be closed' + err);
        })
    }

    async clickOnCancelTopButton() {
        return await this.clickOnElement(this.cancelTopButton);
    }

    clickOnOkButton() {
        return this.clickOnElement(this.okButton);
    }
}

module.exports = NotificationDialog;
