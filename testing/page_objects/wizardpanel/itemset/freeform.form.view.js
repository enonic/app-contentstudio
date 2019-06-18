/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",
    elementType_Input: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'ui.RadioButton') and descendant::label[text()='Input']]",
    elementType_Button: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'ui.RadioButton') and descendant::label[text()='Button']]",
    elementType_Select: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'ui.RadioButton') and descendant::label[text()='Select']]",
};

class FreeFormView extends Page {

    //element type 'input' - radio button
    get elementType_Input() {
        return xpath.itemSet + xpath.elementType_Input;
    }

    //element type 'Button' - radio button
    get elementType_Button() {
        return xpath.itemSet + xpath.elementType_Button;
    }

    clickOnElementType_Input() {
        return this.clickOnElement(this.elementType_Input);
    }

    clickOnElementType_Button() {
        return this.clickOnElement(this.elementType_Button);
    }
};
module.exports = FreeFormView;



