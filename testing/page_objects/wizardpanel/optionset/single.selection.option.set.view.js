/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const xpath = {
    container: "//div[contains(@id,'FormView')]//div[contains(@id,'FormOptionSetView') and descendant::p[text()='Single selection']]",
    nameTextInput: "//div[contains(@id,'InputView') and descendant::div[text()='Name']]" + lib.TEXT_INPUT,
    addItemSetButton: "//button[contains(@id,'Button') and child::span[text()='Add My Item-set']]",
    removeItemSetOccurrenceButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "/a[@class='remove-button']",
    labelInput: "//div[contains(@id,'FormItemSetOccurrenceView')]//input[contains(@name,'label')]"
};

class SingleSelectionOptionSet extends Page {

    get nameTextInput() {
        return xpath.container + xpath.nameTextInput;
    }

    get addItemSetButton() {
        return xpath.container + xpath.addItemSetButton;
    }

    get removeItemSetOccurrenceButton() {
        return xpath.container + xpath.removeItemSetOccurrenceButton;
    }

    async typeOptionName(name) {
        await this.typeTextInInput(this.nameTextInput, name);
        return await this.pause(300);
    }

    async typeInLabelInput(text, index) {
        let selector = xpath.container + "//div[contains(@id,'TextLine')]//input[contains(@name,'label')]";
        if (typeof index === 'undefined') {
            await this.typeTextInInput(selector, text);
        } else {
            let result = await this.findElements(selector);
            await result[index].setValue(text);
        }
        return await this.pause(300);
    }

    async clickOnAddItemSetButton() {
        await this.clickOnElement(this.addItemSetButton);
        return await this.pause(500);
    }

    async clickOnRemoveItemSetOccurrenceView(index) {
        let elems = await this.findElements(this.removeItemSetOccurrenceButton);
        await this.getBrowser().elementClick(elems[index].elementId);
        return await this.pause(500);
    }
}
module.exports = SingleSelectionOptionSet;
