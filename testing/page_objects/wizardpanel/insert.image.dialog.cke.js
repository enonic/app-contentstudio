const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const dialog = {
    container: `//div[contains(@id,'ImageModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

const insertImageModalDialog = Object.create(page, {

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
    insertButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.insertButton}`;
        }
    },
    textInput: {
        get: function () {
            return `${dialog.container}` + `${elements.TEXT_INPUT}`;
        }
    },
    typeInTextInput: {
        value: function (text) {
            return this.typeTextInInput(this.textInput, text).catch((err) => {
                this.doCatch('site_conf_err', err);
            })
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
                this.saveScreenshot('err_click_on_insert_image_button');
                throw new Error('Insert Image Dialog, error when click on the Insert button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.insertButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_insert_image_dialog');
                throw new Error('Insert Image Dialog should be opened!' + err);
            });
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForNotVisible(`${dialog.container}`, ms);
        }
    },
});
module.exports = insertImageModalDialog;

