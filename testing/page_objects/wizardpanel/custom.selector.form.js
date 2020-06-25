/**
 * Created on 03.06.2019.
 */

const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'CustomSelector')]",
    selectedOptionByDisplayName:
        displayName => `//div[contains(@id,'CustomSelectorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
};

class CustomSelectorForm extends Page {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    async selectOption(option) {
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.optionsFilterInput, option);
        return await loaderComboBox.selectOption(option);
    }

    async swapOptions(sourceName, destinationName) {
        let sourceElem = XPATH.container + XPATH.selectedOptionByDisplayName(sourceName);
        let destinationElem = XPATH.container + XPATH.selectedOptionByDisplayName(destinationName);
        let source = await this.findElement(sourceElem);
        let destination = await this.findElement(destinationElem);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'CustomSelectorSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    isOptionFilterDisplayed() {
        return this.isElementDisplayed(this.optionsFilterInput);
    }
};
module.exports = CustomSelectorForm;
