const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'SortContentDialog')]`,
    saveButton: "//button[contains(@id,'DialogButton') and child::span[text()='Save']]",
    cancelButton: "//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]",
    menuButton: "//div[contains(@id,'TabMenuButton')]",
};

class SortContentDialog extends Page {

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get saveButton() {
        return XPATH.container + XPATH.deleteButton;
    }

    get menuButton() {
        return XPATH.container + XPATH.menuButton;
    }

    clickOnSaveButton() {
        return this.clickOnElement(this.saveButton).catch(err => {
            this.saveScreenshot('err_click_on_delete_dialog');
            throw new Error(err);
        })
    }

    waitForDialogVisible() {
        return this.waitForElementDisplayed(XPATH.saveButton, appConst.TIMEOUT_2);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3).catch(err => {
            this.saveScreenshot('err_close_sort_content_dialog');
            throw new Error('Sort content dialog must be closed' + err);
        })
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButtonBottom);
    }

    //expand menu-options('Modified date', 'Display name'...)
    clickOnMenuButton() {
        return this.clickOnElement(this.menuButton);
    }

    getMenuItems() {
        let selector = xpath.container + "//li[contains(@id,'SortContentTabMenuItem')]//a";
        return this.getText(selector);
    }
};
module.exports = SortContentDialog;

