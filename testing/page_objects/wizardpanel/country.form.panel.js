/**
 * Created on 22.07.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    descriptionTextArea: "//textarea[contains(@name,'description')]",
    populationTextInput: "//input[contains(@name,'population')]",
};

class CountryFormPanel extends Page {

    get descriptionTextArea() {
        return lib.FORM_VIEW + XPATH.descriptionTextArea;
    }

    get populationInput() {
        return lib.FORM_VIEW + XPATH.populationTextInput;
    }

    async typeDescription(description) {
        await this.waitForElementDisplayed(this.descriptionTextArea, appConst.mediumTimeout);
        await this.typeTextInInput(this.descriptionTextArea, description);
    }

    async typePopulation(population) {
        await this.waitForElementDisplayed(this.populationInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.populationInput, population);
    }
}

module.exports = CountryFormPanel;


