/**
 * Created on 23.07.2021. updated on 28.07.2026
 */
const Page = require('../page');

const XPATH = {
    formRenderer: "//div[@data-component='FormRenderer']",
    locationTextInput: "//input[@data-component='GeoPointInput' and @aria-label='Location']",
    populationTextInput: "//input[@aria-label='Population']",
};

class CityFormPanel extends Page {

    get locationInput() {
        return XPATH.formRenderer + XPATH.locationTextInput;
    }

    get populationInput() {
        return XPATH.formRenderer + XPATH.populationTextInput;
    }

    async typeLocation(location) {
        await this.waitForElementDisplayed(this.locationInput);
        await this.typeTextInInput(this.locationInput, location);
        return await this.pause(200);
    }

    async typePopulation(population) {
        await this.waitForElementDisplayed(this.populationInput);
        await this.typeTextInInput(this.populationInput, population);
        return await this.pause(200);
    }

    async clearPopulationInput() {
        await this.waitForElementDisplayed(this.populationInput);
        await this.clearInputText(this.populationInput);
        return await this.pause(200);
    }

    async getLocation() {
        await this.waitForElementDisplayed(this.locationInput);
        return await this.getTextInInput(this.locationInput);
    }

    async getPopulation() {
        await this.waitForElementDisplayed(this.populationInput);
        return await this.getTextInInput(this.populationInput);
    }
}

module.exports = CityFormPanel;
