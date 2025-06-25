/**
 * Created on 23.07.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

const XPATH = {
    locationTextInput: "//input[contains(@placeholder,'latitude,longitude')]",
    populationTextInput: "//input[contains(@name,'cityPopulation')]",
};

class CityFormPanel extends Page {

    get locationInput() {
        return lib.FORM_VIEW + XPATH.locationTextInput;
    }

    get populationInput() {
        return lib.FORM_VIEW + XPATH.populationTextInput;
    }

    async typeLocation(location) {
        await this.waitForElementDisplayed(this.locationInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.locationInput, location);
        return await this.pause(200);
    }

    async typePopulation(population) {
        await this.waitForElementDisplayed(this.populationInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.populationInput, population);
        return await this.pause(200);
    }

    async getPopulation() {
        await this.waitForElementDisplayed(this.populationInput, appConst.mediumTimeout);
        return await this.getTextInInput(this.populationInput);
    }
}

module.exports = CityFormPanel;


