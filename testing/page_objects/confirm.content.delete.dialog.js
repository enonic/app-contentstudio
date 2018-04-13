/**
 * Created  on 20/01/2018
 */
const page = require('./page');
const elements = require('../libs/elements');
const dialog = {
    container: `//div[contains(@id,'ConfirmContentDeleteDialog')]`,
    confirmButton: `//button[contains(@id,'DialogButton') and child::span[text()='Confirm']]`,
    cancelButton: `//div[@class='dialog-buttons']//button/span[text()='Cancel']`,

};
var confirmContentDeleteDialog = Object.create(page, {

    warningMessage: {
        get: function () {
            return `${dialog.container}//div[contains(@id,'ModalDialogHeader')]//h6[text()='You are about to delete a site or multiple content items. This action cannot be undone.']`;
        }
    },
    confirmButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.confirmButton}`;

        }
    },
    numberInput: {
        get: function () {
            return `${dialog.container}` + `${elements.TEXT_INPUT}`;

        }
    },
    cancelButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    clickOnConfirmButton: {
        value: function () {
            return this.doClick(this.confirmButton).then(()=> {
                return this.waitForNotVisible(`${dialog.container}`, 2000);
            }).catch((err)=> {
                this.saveScreenshot('err_close_confirmation');
                throw new Error('Confirmation dialog must be closed!')
            })
        }
    },
    typeNumberOfContent: {
        value: function (number) {
            return this.typeTextInInput(this.numberInput, number);
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

    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton);
        }
    },
});
module.exports = confirmContentDeleteDialog;
