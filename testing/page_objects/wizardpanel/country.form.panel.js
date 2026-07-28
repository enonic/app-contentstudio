/**
 * Created on 22.07.2021. updated on 28.07.2026
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

const XPATH = {
    formRenderer: "//div[@data-component='FormRenderer']",
    descriptionTextArea: "//textarea[@aria-label='Description']",
    populationTextInput: "//input[@aria-label='Population']",
};

class CountryFormPanel extends Page {

    get descriptionTextArea() {
        return XPATH.formRenderer + XPATH.descriptionTextArea;
    }

    get populationInput() {
        return XPATH.formRenderer + XPATH.populationTextInput;
    }

    async typeDescription(description) {
        await this.waitForElementDisplayed(this.descriptionTextArea, appConst.mediumTimeout);
        await this.typeTextInInput(this.descriptionTextArea, description);
        return await this.pause(200);
    }

    async typePopulation(population) {
        await this.waitForElementDisplayed(this.populationInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.populationInput, population);
        return await this.pause(200);
    }

    async getDescription() {
        await this.waitForElementDisplayed(this.descriptionTextArea, appConst.mediumTimeout);
        return await this.getTextInInput(this.descriptionTextArea);
    }

    async getPopulation() {
        await this.waitForElementDisplayed(this.populationInput, appConst.mediumTimeout);
        return await this.getTextInInput(this.populationInput);
    }
}

module.exports = CountryFormPanel;
