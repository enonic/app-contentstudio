/**
 * Created on 1.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'MoveContentDialog')]`,
    header: `//div[contains(@class,'modal-dialog-header')]/h2`,
    path: `//div[contains(@class,'modal-dialog-header')]/h6`,
    moveButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Move')]]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Cancel')]]`,
};

var moveContentDialog = Object.create(page, {

    header: {
        get: function () {
            return `${xpath.container}${xpath.header}`;
        }
    },
    moveButton: {
        get: function () {
            return `${xpath.container}${xpath.moveButton}`;
        }
    },
    cancelButton: {
        get: function () {
            return `${xpath.container}${xpath.cancelButton}`;
        }
    },
    header: {
        get: function () {
            return `${xpath.container}${xpath.header}`;
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${xpath.container}${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton).catch((err)=> {
                this.saveScreenshot('err_move_dialog_cancel');
                throw new Error('Error when try click on Cancel button ' + err);
            })
        }
    },
    waitForOpened: {
        value: function () {
            return this.waitForVisible(this.moveButton, appConst.TIMEOUT_3).catch(err=> {
                this.saveScreenshot('err_move_content_dialog_load');
                throw new Error('Move Content dialog was not loaded! ' + err);
            });
        }
    },
    waitForClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_3).catch(error=> {
                this.saveScreenshot('err_move_content_dialog_close');
                throw new Error('Move Content Dialog was not closed');
            });
        }
    },
    getHeaderText: {
        value: function () {
            return this.getText(this.header);
        }
    },

    clickOnMoveButton: {
        value: function (contentTypeName) {
            return this.doClick(this.moveButton).catch(err=> {
                this.saveScreenshot('err_click_on_move_button')
                throw new Error('Move dialog:' + err);
            }).pause(500);

        }
    }
});
module.exports = moveContentDialog;
