/**
 * Created on 24.11.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",
    addContactInfoButton: "//button[contains(@id,'Button') and @title='Add Contact Info']",
    labelInput: "//input[contains(@id,'TextInput') and contains(@name,'label')]",
    streetInput: "//input[contains(@id,'TextInput') and contains(@name,'street')]",
    itemSetOccurrenceLabel: "//div[contains(@id,'FormOccurrenceDraggableLabel')]",
    firstNameView: "//div[contains(@id,'InputView') and descendant::div[text()='First Name']]",
    lastNameView: "//div[contains(@id,'InputView') and descendant::div[text()='Last Name']]"

};

class SetInSetView extends Page {

    get addContactInfoButton() {
        return xpath.itemSet + xpath.addContactInfoButton;
    }

    get labelInput() {
        return xpath.itemSet + lib.OCCURRENCE_VIEW + xpath.labelInput;
    }

    get streetInput() {
        return xpath.itemSet + lib.OCCURRENCE_VIEW + xpath.streetInput;
    }

    get firstNameInput() {
        return xpath.firstNameView + lib.TEXT_INPUT;
    }

    get lastNameInput() {
        return xpath.lastNameView + lib.TEXT_INPUT;
    }

    waitForAddContactInfoButtonDisplayed() {
        return this.waitForElementDisplayed(this.addContactInfoButton, appConst.mediumTimeout);
    }

    async clickOnAddContactInfoButton() {
        await this.waitForAddContactInfoButtonDisplayed();
        await this.clickOnElement(this.addContactInfoButton);
    }

    async typeTextInStreetInput(text) {
        await this.waitForElementDisplayed(this.streetInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.streetInput, text);
    }

    async typeTextInLabelInput(text) {
        await this.waitForElementDisplayed(this.labelInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.labelInput, text);
    }

    async getItemSetTitle() {
        let locator = xpath.itemSet + xpath.itemSetOccurrenceLabel;
        let result = await this.getText(locator);
        let tittle = result.split("\n");
        return tittle[0].trim();
    }

    async getItemSetSubtitle() {
        let locator = xpath.itemSet + xpath.itemSetOccurrenceLabel + "//p[@class='note']";
        return await this.getText(locator);
    }

    async typeTextInFirstNameInput(text) {
        await this.waitForElementDisplayed(this.firstNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.firstNameInput, text);
    }

    async typeTextInLastNameInput(text) {
        await this.waitForElementDisplayed(this.lastNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.lastNameInput, text);
    }
}

module.exports = SetInSetView;
