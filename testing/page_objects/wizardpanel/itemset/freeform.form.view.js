/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",
    elementTypeInput: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'RadioButton') and descendant::label[text()='Input']]",
    elementTypeButton: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'RadioButton') and descendant::label[text()='Button']]",
    elementTypeSelect: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'RadioButton') and descendant::label[text()='Select']]",
};

class FreeFormView extends Page {

    //element type 'input' - radio button
    get elementTypeInput() {
        return xpath.itemSet + xpath.elementTypeInput;
    }

    //element type 'Button' - radio button
    get elementTypeButton() {
        return xpath.itemSet + xpath.elementTypeButton;
    }

    clickOnElementTypeInput() {
        return this.clickOnElement(this.elementTypeInput);
    }

    clickOnElementTypeButton() {
        return this.clickOnElement(this.elementTypeButton);
    }
};
module.exports = FreeFormView;
