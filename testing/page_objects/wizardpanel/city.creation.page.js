/**
 * Created on 01.09.2021
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//form[@id='formCityCreation')]",
    cityNameInput: "//input[@name='cityName']",
    cityLocation: "//input[@name='cityLocation']",
    submitButton: "//input[@type='submit']",
    cityPopulation: "//input[@name='cityPopulation']",
};

class CityCreationPage extends Page {

    get cityNameInput() {
        return XPATH.cityNameInput;
    }

    get cityLocation() {
        return XPATH.cityLocation;
    }

    get cityPopulation() {
        return XPATH.cityPopulation;
    }

    get submitButton() {
        return XPATH.submitButton;
    }

    async typeCityName(name) {
        await this.waitForElementDisplayed(this.cityNameInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.cityNameInput, name);
    }

    async typeLocation(location) {
        await this.waitForElementDisplayed(this.cityLocation, appConst.mediumTimeout);
        await this.typeTextInInput(this.cityLocation, location);
    }

    async typePopulation(population) {
        await this.waitForElementDisplayed(this.cityPopulation, appConst.mediumTimeout);
        await this.typeTextInInput(this.cityPopulation, population);
    }

    async clickOnSubmitButton() {
        await this.waitForElementEnabled(this.submitButton, appConst.mediumTimeout);
        await this.clickOnElement(this.submitButton);
    }
}

module.exports = CityCreationPage;


