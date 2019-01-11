const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');

const dialog = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    textInput: `//div[contains(@id,'FormItem') and child::label[text()='Text']]//input[@type='text']`,
    urlInput: `//div[contains(@id,'FormItem') and child::label[text()='Url']]//input[@type='text']`,
    emailInput: `//div[contains(@id,'FormItem') and child::label[text()='Email']]//input[@type='text']`,
};

const insertLinkDialog = Object.create(page, {

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
    emailInput: {
        get: function () {
            return `${dialog.container}` + `${dialog.emailInput}`;
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
    selectTargetInDownloadTab: {
        value: function (targetDisplayName) {
            let selector = dialog.container + elements.tabBarItemByName('Download');
            return this.doClick(selector).then(() => {
                return this.waitForVisible(loaderComboBox.optionsFilterInput, appConst.TIMEOUT_2);
            }).then(() => {
                return loaderComboBox.typeTextAndSelectOption(targetDisplayName);
            })
        }
    },
    fillEmailForm: {
        value: function (email) {
            let selector = dialog.container + elements.tabBarItemByName('Email');
            return this.doClick(selector).then(() => {
                return this.waitForVisible(this.emailInput, appConst.TIMEOUT_2);
            }).then(() => {
                return this.typeTextInInput(this.emailInput, email);
            }).catch(err => {
                this.saveScreenshot('err_type_email');
                throw new Error('error when type email in Insert Link modal dialog ' + err);
            });
        }
    },
    selectTargetInContentTab: {
        value: function (targetDisplayName) {
            return this.clickOnBarItem('Content').then(() => {
                return this.waitForVisible(loaderComboBox.optionsFilterInput, appConst.TIMEOUT_2);
            }).then(() => {
                return loaderComboBox.typeTextAndSelectOption(targetDisplayName, "//div[contains(@id,'ContentComboBox')]");
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
                this.saveScreenshot('err_click_on_insert_link_icon');
                throw new Error('Insert Link Dialog, error when click on the Insert button  ' + err);
            })
        }
    },
    clickOnInsertButtonAndWaitForClosed: {
        value: function () {
            return this.doClick(this.insertButton).catch((err) => {
                this.saveScreenshot('err_click_on_insert_link_icon');
                throw new Error('Insert Link Dialog, error when click on the Insert button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            })
        }
    },
    waitForValidationMessage: {
        value: function () {
            return this.waitForVisible(dialog.container + elements.VALIDATION_RECORDING_VIEWER, appConst.TIMEOUT_2).catch(err => {
                return false;
            });
        }
    },
    isDialogOpened: {
        value: function () {
            return this.isVisible(dialog.container);
        }
    },
    waitForDialogLoaded: {
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
    clickOnBarItem: {
        value: function (name) {
            let selector = dialog.container + elements.tabBarItemByName(name);
            return this.doClick(selector).catch(err => {
                this.saveScreenshot('err_click_on_bar_item');
                throw new Error('Insert Link Dialog, error when click on the bar item ' + name + " " + err);
            });
        }
    },
    isTabActive: {
        value: function (name) {
            let barItem = dialog.container + elements.tabBarItemByName(name);
            return this.getAttribute(barItem, "class").then(result => {
                return result.includes('active');
            });
        }
    },
    getSelectedOptionDisplayName: {
        value: function () {
            let selector = dialog.container + elements.CONTENT_SELECTED_OPTION_VIEW + elements.H6_DISPLAY_NAME;
            return this.getText(selector);

        }
    }
});
module.exports = insertLinkDialog;

