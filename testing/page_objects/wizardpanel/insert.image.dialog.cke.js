const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const comboBox = require('../components/loader.combobox');

const dialog = {
    container: `//div[contains(@id,'ImageModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

const insertImageModalDialog = Object.create(page, {

    imageOptionsFilterInput: {
        get: function () {
            return dialog.container + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
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
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
        }
    },
    filterAndSelectImage: {
        value: function (imageDisplayName) {
            return this.waitForVisible(this.imageOptionsFilterInput).then(() => {
                return comboBox.typeTextAndSelectOption(imageDisplayName, dialog.container);
            })
        }
    }
});
module.exports = insertImageModalDialog;

