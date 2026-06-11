/**
 * Created on 28.03.2022
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    firstNameInput: `//input[contains(@name,'firstName')]`,
    lastNameInput: `//input[contains(@name,'lastName')]`,
    cityInput:`//input[contains(@name,'city')]`,
};

class PersonForm extends Page {

    get firstNameInput() {
        return COMMON.INPUTS.inputFieldByLabel('First Name') + "//input";
    }

    get lastNameInput() {
        return COMMON.INPUTS.inputFieldByLabel('Last Name') + "//input";
    }

    get cityInput() {
        return COMMON.INPUTS.inputFieldByLabel('City') + "//input";
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
