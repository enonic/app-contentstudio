const page = require('./page');
const appConst = require('../libs/app_const');
const dialog = {
    container: `//div[contains(@id,'ContentPublishDialog')]`,
    deleteButton: `//button/span[contains(.,'Delete')]`,
    publishButton: `//button[contains(@id,'ActionButton') and child::span[contains(.,'Publish')]]`,
    cancelButton: `//button/span[text()='Cancel']`,
    includeChildrenToogler: `//div[contains(@id,'IncludeChildrenToggler')]`,
};

const contentPublishDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;

        }
    },
    publishButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.publishButton}`;
        }
    },
    includeChildrenToogler: {
        get: function () {
            return `${dialog.container}` + `${dialog.includeChildrenToogler}`;
        }
    },

    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.publishButton, appConst.TIMEOUT_2);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_close_publish_dialog');
                throw new Error('Publish dialog must be closed ' + err);
            })
        }
    },
    clickOnPublishButton: {
        value: function () {
            return this.doClick(this.publishButton).catch(err => {
                this.saveScreenshot('err_click_on_publish_button_publish_dialog');
                throw new Error('Error when clicking Publish dialog must be closed ' + err);
            })
        }
    },

});
module.exports = contentPublishDialog;

