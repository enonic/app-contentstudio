/**
 * Created on 23.01.2019.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');

const xpath = {
    container: "//div[contains(@id,'api.form.FormView')]//div[contains(@id,'FormOptionSetView') and descendant::div[text()='Single selection']]",
    nameTextInput: "//div[contains(@id,'InputView') and descendant::div[text()='Name']]" + elements.TEXT_INPUT,
    addItemSetButton: "//button[contains(@id,'Button') and child::span[text()='Add My Item-set']]",
    removeItemSetOccurrenceButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "/a[@class='remove-button']",
    labelInput: "//div[contains(@id,'FormItemSetOccurrenceView')]//input[contains(@name,'label')]"
};
const singleSelectionOptionSet = Object.create(page, {

    nameTextInput: {
        get: function () {
            return xpath.container + xpath.nameTextInput;
        }
    },
    addItemSetButton: {
        get: function () {
            return xpath.container + xpath.addItemSetButton;
        }
    },
    removeItemSetOccurrenceButton: {
        get: function () {
            return xpath.container + xpath.removeItemSetOccurrenceButton;
        }
    },
    typeOptionName: {
        value: function (name) {
            return this.typeTextInInput(this.nameTextInput, name);
        }
    },
    typeItemSetLabel: {
        value: function (text, index) {
            return this.elements(xpath.labelInput).then(elems => {
                return this.getBrowser().elementIdValue(elems.value[1].ELEMENT, text);
            })
        }
    },
    clickOnAddItemSetButton: {
        value: function () {
            return this.doClick(this.addItemSetButton).pause(500);
        }
    },
    clickOnRemoveItemSetOccurrenceView: {
        value: function (index) {
            return this.elements(this.removeItemSetOccurrenceButton).then(elems => {
                return this.getBrowser().elementIdClick(elems.value[index].ELEMENT);
            }).pause(500);
        }
    },
});
module.exports = singleSelectionOptionSet;


