/**
 * Created  on 6/29/2017.
 */
const page = require('./page')
const dialog = {
    container: `//div[contains(@id,'ConfirmationDialog')]`,
    yesButton: `//button[contains(@id,'DialogButton') and child::span[text()='Yes']]`,
    noButton: `//div[@class='dialog-buttons']//button/span[text()='No']`
};
var confirmationDialog = Object.create(page, {

    warningMessage: {
        get: function () {
            return `${dialog.container}//h6[text()='Are you sure you want to delete this item?']`;
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
            return this.doClick(this.yesButton).then(()=> {
                return this.waitForNotVisible(`${dialog.container}`, 2000);
            }).catch((err)=> {
                this.saveScreenshot('err_close_confirmation');
                throw new Error('Confirmation dialog must be closed!')
            })
        }
    },
    waitForDialogVisible: {
        value: function (ms) {
            return this.waitForVisible(`${dialog.container}`, ms);
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForVisible(`${dialog.container}`, ms);
        }
    },
    isWarningMessageVisible: {
        value: function () {
            return this.isVisible(this.warningMessage);
        }
    },

    clickOnNoButton: {
        value: function () {
            return this.doClick(this.noButton);
        }
    },
});
module.exports = confirmationDialog;