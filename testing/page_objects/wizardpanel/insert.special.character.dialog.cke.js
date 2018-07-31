const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const dialog = {
    container: `//div[contains(@id,'SpecialCharDialog')]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

var insertSpecialCharacterDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${dialog.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },

    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton);
        }
    },
    clickOnInsertButton: {
        value: function () {
            return this.doClick(this.insertButton).catch((err) => {
                this.saveScreenshot('err_click_on_insert_anchor_icon');
                throw new Error('Insert Anchor Dialog, error when click on the Insert button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_insert_anchor_dialog');
                throw new Error('Insert Special Character Dialog should be opened!' + err);
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
        }
    },
});
module.exports = insertSpecialCharacterDialog;

