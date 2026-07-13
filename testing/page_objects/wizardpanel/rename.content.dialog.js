const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[@data-component='RenameContentDialog']",
    nameAvailabilityStatus: "//div[@data-component='Input']//input/following-sibling::div",
};

class RenameContentDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get closeButton() {
        return `${XPATH.container}` + BUTTONS.buttonAriaLabel('Close');
    }

    get renameButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Rename');
    }

    // The label is 'New name *' for existing content and 'Name *' for unnamed content:
    get newNameInput() {
        return XPATH.container +
               "//div[@data-component='Input' and descendant::label[contains(.,'New name') or contains(.,'Name')]]//input";
    }

    get validationPathMessage() {
        return XPATH.container + "//div[contains(@id,'RenameInput')]//div[contains(@class,'status')]";
    }

    get nameAvailabilityStatus() {
        return XPATH.container + XPATH.nameAvailabilityStatus;
    }

    // Waits until the name-availability status equals the expected value ('Available' or 'Unavailable')
    async waitForNameAvailabilityStatus(status) {
        let locator = this.nameAvailabilityStatus;
        await this.getBrowser().waitUntil(async () => {
            let actual = await this.getText(locator);
            return actual && actual.trim() === status;
        }, {
            timeout: appConst.mediumTimeout,
            timeoutMsg: `Rename content dialog: expected name availability status '${status}' did not appear`
        });
    }

    async typeInNewNameInput(text) {
        try {
            await this.typeTextInInput(this.newNameInput, text);
            return await this.pause(700);
        } catch (err) {
            await this.handleError("Rename content dialog: Cannot type in the 'New name' input!", 'err_type_in_new_name_input', err);
        }
    }

    async clickOnCloseButton() {
        await this.clickOnElement(this.closeButton);
    }

    async getNameInInput() {
        return await this.getTextInInput(this.newNameInput);
    }


    async clearNewNameInput() {
        await this.clearInputText(this.newNameInput);
        return await this.pause(300);
    }

    async waitForValidationMessageDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.validationPathMessage);
        } catch (err) {
            await this.handleError("Rename content dialog: Validation path message is not displayed!", 'err_validation_path_dialog', err);
        }
    }

    waitForRenameButtonEnabled() {
        return this.waitForElementEnabled(this.renameButton);
    }

    waitForRenameButtonDisabled() {
        return this.waitForElementDisabled(this.renameButton);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnRenameButton() {
        await this.waitForRenameButtonEnabled();
        await this.clickOnElement(this.renameButton);
        await this.waitForDialogClosed();
        await this.pause(500);
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(this.renameButton);
        } catch (err) {
            await this.handleError("Rename published content Dialog should be opened!", 'err_open_rename_content_dialog', err);
        }
    }

    async waitForDialogClosed() {
        return await this.waitForElementNotDisplayed(XPATH.container);
    }

    getDialogTitle() {
        return this.getText(XPATH.container + "//h2[@class='title']");
    }

    getPath() {
        return this.getText(XPATH.container + "//h6[@class='content-path']");
    }

    async getValidationPathMessage() {
        await this.waitForValidationMessageDisplayed();
        return await this.getText(this.validationPathMessage);
    }
}

module.exports = RenameContentDialog;
