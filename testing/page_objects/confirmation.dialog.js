/**
 * Created  on 6/29/2017.
 */
const page = require('./page');
const appConst = require('../libs/app_const');
const dialog = {
    container: `//div[contains(@id,'ConfirmationDialog')]`,
    yesButton: `//button[contains(@id,'DialogButton') and child::span[text()='Yes']]`,
    noButton: `//div[@class='dialog-buttons']//button/span[text()='No']`
};
const confirmationDialog = Object.create(page, {

    warningMessage: {
        get: function () {
            return `${dialog.container}//h6[@class='question']`;
        }
    },
    yesButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.yesButton}`;

        }
    },
    noButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.yesButton}`;
        }
    },
    clickOnYesButton: {
        value: function () {
            return this.waitForVisible(this.yesButton, 1000).then(() => {
                return this.doClick(this.yesButton);
            }).then(() => {
                return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
            }).catch(err => {
                this.saveScreenshot('err_close_confirmation');
                throw new Error('Confirmation dialog must be closed!')
            })
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(`${dialog.container}`, appConst.TIMEOUT_3).catch(err => {
                return false;
            })
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
        }
    },
    isWarningMessageVisible: {
        value: function () {
            return this.isVisible(this.warningMessage);
        }
    },
    getWarningMessage: {
        value: function () {
            return this.getText(this.warningMessage)
        }
    },

    clickOnNoButton: {
        value: function () {
            return this.doClick(this.noButton);
        }
    },
});
module.exports = confirmationDialog;