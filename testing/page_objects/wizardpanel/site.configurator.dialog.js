const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const dialog = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,//'api.form.inputtype.appconfig.ApplicationConfiguratorDialog'
    applyButton: `//button[contains(@id,'DialogButton') and child::span[text()='Apply']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    imageSelectorOptionFilterInput: `//div[contains(@id,'ImageContentComboBox')]//input[contains(@id,'ComboBoxOptionFilterInput')]`,
};

const siteConfiguratorDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    applyButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.applyButton}`;
        }
    },
    textInput: {
        get: function () {
            return `${dialog.container}` + `${elements.TEXT_INPUT}`;
        }
    },
    typeInTextInput: {
        value: function (text) {
            return this.typeTextInInput(this.textInput, text).catch(err => {
                this.doCatch('site_conf_err', err);
            })
        }
    },
    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton);
        }
    },
    clickOnApplyButton: {
        value: function () {
            return this.doClick(this.applyButton).catch(err => {
                this.saveScreenshot('err_click_on_apply_dialog');
                throw new Error('Site Configurator Dialog, error when click on the Apply button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.applyButton, appConst.TIMEOUT_3);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
        }
    },
});
module.exports = siteConfiguratorDialog;

