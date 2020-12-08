/**
 * Created on 09.07.2020.
 */

const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

class BaseSelectorForm extends Page {

    //Selects an option by the display name
    async selectOption(optionDisplayName) {
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.optionsFilterInput, optionDisplayName);
        await loaderComboBox.selectOption(optionDisplayName);
        return await loaderComboBox.pause(300);
    }

    //Selects an option by the name
    async selectOptionByName(optionName) {
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.optionsFilterInput, optionName);
        await loaderComboBox.selectOptionByName(optionName);
        return await loaderComboBox.pause(300);
    }

    async swapOptions(sourceName, destinationName) {
        let sourceElem = this.selectedOptionByDisplayName(sourceName);
        let destinationElem = this.selectedOptionByDisplayName(destinationName);
        let source = await this.findElement(sourceElem);
        let destination = await this.findElement(destinationElem);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    isOptionFilterDisplayed() {
        return this.isElementDisplayed(this.optionsFilterInput);
    }
}
module.exports = BaseSelectorForm;
