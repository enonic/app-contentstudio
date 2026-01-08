/**
 * Created on 28.03.2022
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

const XPATH = {
    firstNameInput: `//input[contains(@name,'firstName')]`,
    lastNameInput: `//input[contains(@name,'lastName')]`,
    cityInput:`//input[contains(@name,'city')]`,
};

class PersonForm extends Page {

    get firstNameInput() {
        return lib.FORM_VIEW + XPATH.firstNameInput;
    }

    get lastNameInput() {
        return lib.FORM_VIEW + XPATH.lastNameInput;
    }

    get cityInput() {
        return lib.FORM_VIEW + XPATH.cityInput;
    }

    async typeInFirstNameInput(title) {
        await this.waitForElementDisplayed(this.firstNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.firstNameInput, title);
        return await this.pause(500);
    }

    async typeInLastNameInput(text) {
        await this.waitForElementDisplayed(this.lastNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.lastNameInput, text);
        return await this.pause(500);
    }

    async typeInCItyInput(text) {
        await this.waitForElementDisplayed(this.cityInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.cityInput, text);
        return await this.pause(500);
    }
}

module.exports = PersonForm;
