const page = require('../page');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'SortContentDialog')]`,
    saveButton: "//button[contains(@id,'DialogButton') and child::span[text()='Save']]",
    cancelButton: "//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]",
    menuButton: "//div[contains(@id,'TabMenuButton')]",
};

const sortContentDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.cancelButton}`;
        }
    },
    saveButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.deleteButton}`;
        }
    },
    menuButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.menuButton}`;
        }
    },
    clickOnSaveButton: {
        value: function () {
            return this.doClick(this.saveButton).catch(err => {
                this.saveScreenshot('err_click_on_delete_dialog');
                throw new Error(err);
            })
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(`${xpath.saveButton}`, appConst.TIMEOUT_2);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_close_sort_content_dialog');
                throw new Error('Sort content dialog must be closed' + err);
            })
        }
    },
    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButtonBottom);
        }
    },
    //expand menu-options('Modified date', 'Display name'...)
    clickOnMenuButton: {
        value: function () {
            return this.doClick(this.cancelButtonBottom);
        }
    },
    getMenuItems:{
        value:function(){
            let selector = xpath.container+ "//li[contains(@id,'SortContentTabMenuItem')]//a";
            return this.getText(selector);
        }
    }
});
module.exports = sortContentDialog;

