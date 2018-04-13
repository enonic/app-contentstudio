const page = require('../page');
const elements = require('../../libs/elements');
const dialog = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[text()='Apply']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

var siteConfiguratorDialog = Object.create(page, {

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
            return this.typeTextInInput(this.textInput, text).catch((err)=> {
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
            return this.doClick(this.applyButton).catch((err)=> {
                this.saveScreenshot('err_click_on_apply_dialog');
                throw new Error('Site Configurator Dialog, error when click on the Apply button  ' + err);
            }).then(()=> {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForDialogVisible: {
        value: function (ms) {
            return this.waitForVisible(this.applyButton, ms);
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForNotVisible(`${dialog.container}`, ms);
        }
    },
});
module.exports = siteConfiguratorDialog;

