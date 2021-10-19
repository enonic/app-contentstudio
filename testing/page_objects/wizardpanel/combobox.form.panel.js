/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'ComboBox')]",
    optionByName: option => {
        return `//div[contains(@class,'slick-viewport')]//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${option}']`

    },
};

class ComboBoxFormPanel extends Page {

    get optionFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    async typeInFilterAndClickOnOption(option) {
        let optionLocator = XPATH.optionByName(option);
        await this.typeTextInInput(this.optionFilterInput, option);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(200);
    }

    async clickOnRemoveButton(index) {
        await this.waitForElementDisplayed(this.populationInput, appConst.mediumTimeout);
        return await this.getTextInInput(this.populationInput);
    }
}

module.exports = ComboBoxFormPanel;
