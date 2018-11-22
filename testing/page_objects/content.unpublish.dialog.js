const page = require('./page');
const appConst = require('../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'ContentUnpublishDialog')]`,
    unpublishButton: "//button[contains(@id,'DialogButton') and descendant::span[contains(.,'Unpublish')]]",
    cancelButtonBottom: "//button[contains(@class,'cancel-button-bottom')]",
};

const contentUnpublishDialog = Object.create(page, {

    cancelButtonBottom: {
        get: function () {
            return `${xpath.container}` + `${xpath.cancelButtonBottom}`;
        }
    },
    unpublishButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.unpublishButton}`;
        }
    },
    waitForDialogOpened: {
        value: function () {
            return this.waitForVisible(this.unpublishButton, appConst.TIMEOUT_2);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_close_unpublish_dialog');
                throw new Error('unPublish dialog must be closed ' + err);
            })
        }
    },
    clickOnUnpublishButton: {
        value: function () {
            return this.doClick(this.unpublishButton).catch(err => {
                this.saveScreenshot('err_click_on_unpublish_button');
                throw new Error('Error when clicking unpublish button, dialog must be closed ' + err);
            })
        }
    },
});
module.exports = contentUnpublishDialog;

