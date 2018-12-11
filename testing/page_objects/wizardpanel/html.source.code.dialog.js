const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'CodeDialog')]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    okButton: `//button[contains(@id,'DialogButton') and child::span[text()='OK']]`,
    textArea: `//textarea[@name='source-textarea']`
};

const htmlSourceCodeDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.cancelButton}`;
        }
    },
    okButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.okButton}`;
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${xpath.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },

    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton);
        }
    },
    clickOnOkButton: {
        value: function () {
            return this.doClick(this.okButton).catch(err => {
                this.saveScreenshot('err_source_dlg_clicking_ok');
                throw new Error('Source Code Dialog, error when click on the `OK` button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_source_code_dialog');
                throw new Error('Source Code Dialog must be opened!' + err);
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_2);
        }
    },
    getText: {
        value: function () {
            return this.getTextFromInput(xpath.textArea);
        }
    },
    typeText: {
        value: function (text) {
            return this.typeTextInInput(xpath.textArea, text);
        }
    }
});
module.exports = htmlSourceCodeDialog;

