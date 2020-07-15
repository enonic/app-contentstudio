/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

const XPATH = {
    container: `//div[contains(@id,'MoveContentDialog')]`,
    header: `//div[contains(@class,'modal-dialog-header')]/h2`,
    path: `//div[contains(@class,'modal-dialog-header')]/h6`,
    moveButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Move')]]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Cancel')]]`,
    contentMoveComboBox: "//div[contains(@id,'ContentMoveComboBox')]"
};

class MoveContentDialog extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get moveButton() {
        return XPATH.container + XPATH.moveButton;
    }

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton).catch(err => {
            this.saveScreenshot('err_move_dialog_cancel');
            throw new Error('Error when try click on Cancel button ' + err);
        })
    }

    waitForOpened() {
        return this.waitForElementDisplayed(this.moveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_move_content_dialog_load');
            throw new Error('Move Content dialog was not loaded! ' + err);
        });
    }

    waitForClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(error => {
            this.saveScreenshot('err_move_content_dialog_close');
            throw new Error('Move Content Dialog was not closed');
        });
    }

    getHeaderText() {
        return this.getText(this.header);
    }

    async clickOnMoveButton() {
        await this.clickOnElement(this.moveButton);
        return await this.pause(700);
    }

    async typeTextAndClickOnOption(displayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(displayName, XPATH.container);
        } catch (err) {
            throw new Error("Move Content Dialog  " + err);
        }
    }
};
module.exports = MoveContentDialog;
