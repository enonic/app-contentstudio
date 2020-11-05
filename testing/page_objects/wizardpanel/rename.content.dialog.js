const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'RenameContentDialog')]",
    renameButton: "//button[contains(@id,'DialogButton') and child::span[text()='Rename']]",
    cancelButton: "//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]",
};

class RenameContentDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return `${XPATH.container}` + `${lib.CANCEL_BUTTON_TOP}`;
    }

    get renameButton() {
        return XPATH.container + XPATH.renameButton;
    }

    get newNameInput() {
        return XPATH.container + lib.TEXT_INPUT;
    }

    async typeInNewNameInput(text) {
        this.waitForNewNameInputDisplayed();
        return await this.typeTextInInput(this.newNameInput, text);
    }

    waitForNewNameInputDisplayed() {
        return this.waitForElementDisplayed(this.newNameInput, appConst.mediumTimeout);
    }

    waitForRenameButtonEnabled() {
        return this.waitForElementEnabled(this.renameButton, appConst.mediumTimeout);
    }

    waitForRenameButtonDisabled() {
        return this.waitForElementDisabled(this.renameButton, appConst.mediumTimeout);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnRenameButton() {
        await this.waitForRenameButtonEnabled();
        await this.clickOnElement(this.renameButton);
        return await this.waitForDialogClosed();
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_rename_content_dialog');
            throw new Error('Rename published content Dialog should be opened!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    getDialogTitle() {
        return this.getText(XPATH.container + "//h2[@class='title']");
    }

    getPath() {
        return this.getText(XPATH.container + "//h6[@class='content-path']");
    }
}

module.exports = RenameContentDialog;
