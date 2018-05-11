const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const dialog = {
    container: `//div[contains(@id,'LinkModalDialogCKE')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    textInput: `//div[contains(@id,'FormItem') and child::label[text()='Text']]//input[@type='text']`,
    urlInput: `//div[contains(@id,'FormItem') and child::label[text()='Url']]//input[@type='text']`,
};

var insertLinkDialog = Object.create(page, {

    textInput: {
        get: function () {
            return `${dialog.container}` + `${dialog.textInput}`;
        }
    },
    urlInput: {
        get: function () {
            return `${dialog.container}` + `${dialog.urlInput}`;
        }
    },
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
    typeText: {
        value: function (text) {
            return this.typeTextInInput(this.textInput, text).catch(err => {
                this.saveScreenshot('err_type_link_text');
                throw new Error('error when type text in link-text input ' + err);
            });
        }
    },
    typeUrl: {
        value: function (url) {
            return this.typeTextInInput(this.urlInput, url).catch(err => {
                this.saveScreenshot('err_type_link_url');
                throw new Error('error when type URL in Insert Link modal dialog ' + err);
            });
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
                this.saveScreenshot('err_click_on_insert_link_icon');
                throw new Error('Insert Link Dialog, error when click on the Insert button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_insert_link_dialog');
                throw new Error('Insert Link Dialog should be opened!' + err);
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
        }
    },
});
module.exports = insertLinkDialog;

