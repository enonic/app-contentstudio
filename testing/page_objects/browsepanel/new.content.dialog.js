/**
 * Created on 1.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const dialog = {
    container: `//div[contains(@id,'NewContentDialog')]`,
    searchInput: `//div[contains(@id,'FileInput')]/input`,
    header: `//div[contains(@id,'NewContentDialogHeader')]`,
    typesList: `//ul[contains(@id,'FilterableItemsList')]`,
    contentTypeByName: function (name) {
        return `//div[@class='content-types-content']//li[contains(@class,'content-types-list-item') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`;
    },
};
const newContentDialog = Object.create(page, {

    header: {
        get: function () {
            return `${dialog.container}${dialog.header}`;
        }
    },
    searchInput: {
        get: function () {
            return `${dialog.container}${dialog.searchInput}`;
        }
    },
    header: {
        get: function () {
            return `${dialog.container}${dialog.header}`;
        }
    },
    cancelButton: {
        get: function () {
            return `${dialog.container}${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    clickOnCancelButton: {
        value: function () {
            return this.clickOnCancelButton().catch(err => {
                this.saveScreenshot('err_cancel_new_content_dlg');
                throw new Error('Error when clicking on Cancel button ' + err);
            })
        }
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(dialog.typesList, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_new_content_dialog_load');
                throw new Error('New Content dialog was not loaded! ' + err);
            }).pause(200).then(() => {
                return true;
            });
        }
    },
    waitForClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_3).catch(error => {
                this.saveScreenshot('err_new_content_dialog_close');
                throw new Error('New Content Dialog was not closed');
            });
        }
    },
    getHeaderText: {
        value: function () {
            return this.getText(this.header);
        }
    },
    typeSearchText1: {
        value: function (text) {
            return this.typeTextInInput(this.searchInput, text).catch(err => {
                throw new Error("New Content Dialog- error when typing the text in search input! ");
            });
        }
    },
    //typeSearchTextInHiddenInput
    typeSearchText: {
        value: function (text) {
            return this.getBrowser().keys(text).catch(err => {
                throw new Error("New Content Dialog- error when typing the text in search input! ");
            });
        }
    },
    clickOnContentType: {
        value: function (contentTypeName) {
            let typeSelector = `${dialog.contentTypeByName(contentTypeName)}`;
            return this.waitForVisible(typeSelector, appConst.TIMEOUT_3).then(() => {
            }).then(() => {
                return this.getDisplayedElements(typeSelector);
            }).then(result => {
                return this.getBrowser().elementIdClick(result[0].ELEMENT);
            }).catch(err => {
                this.saveScreenshot('err_click_contenttype')
                throw new Error('clickOnContentType:' + err);
            }).pause(500);
        }
    }
});
module.exports = newContentDialog;
