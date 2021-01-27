/**
 * Created on 10.04.2020
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    displayNameInput: `//input[contains(@name,'displayName')]`,
    saveButton: "//button[contains(@id,'ActionButton') and child::span[text()='Save']]",
    deleteButton: "//button[contains(@id,'ActionButton') and child::span[text()='Delete']]",
};

class WizardPanel extends Page {

    get displayNameInput() {
        return XPATH.displayNameInput;
    }

    get saveButton() {
        return XPATH.saveButton;
    }

    get deleteButton() {
        return XPATH.deleteButton;
    }

    waitForSaveButtonEnabled() {
        return this.waitForElementEnabled(this.saveButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot("err_save_button");
            throw new Error("Save button is not enabled: " + err);
        })
    }

    isSaveButtonEnabled() {
        return this.isElementEnabled(this.saveButton);
    }

    waitForSaveButtonDisabled() {
        return this.waitForElementDisabled(this.saveButton, appConst.mediumTimeout);
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    typeDisplayName(displayName) {
        return this.typeTextInInput(this.displayNameInput, displayName);
    }

    clearDisplayNameInput() {
        return this.clearInputText(this.displayNameInput);
    }

    isDisplayNameInputVisible() {
        return this.isElementDisplayed(this.displayNameInput);
    }

    async waitAndClickOnSave() {
        try {
            await this.waitForSaveButtonEnabled();
            await this.clickOnElement(this.saveButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot(lib.generateRandomName("err_save_button"));
            throw new Error("Error when Save button has been clicked!" + err);
        }
    }

    clickOnDeleteButton() {
        return this.clickOnElement(this.deleteButton).catch(err => {
            this.saveScreenshot('err_delete_wizard');
            throw new Error('Error when Delete button has been clicked ' + err);
        });
    }
};
module.exports = {WizardPanel, XPATH};


