/**
 * Created on 12.04.2019.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",

    elementType_Input: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'ui.RadioButton') and descendant::label[text()='Input']]",
    elementType_Button: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'ui.RadioButton') and descendant::label[text()='Button']]",
    elementType_Select: "//div[contains(@id,'FormOptionSetView')]//span[contains(@id,'ui.RadioButton') and descendant::label[text()='Select']]",

};
const freeFormView = Object.create(page, {

    //element type 'input' - radio button
    elementType_Input: {
        get: function () {
            return `${xpath.itemSet}` + `${xpath.elementType_Input}`;
        }
    },
    //element type 'Button' - radio button
    elementType_Button: {
        get: function () {
            return `${xpath.itemSet}` + `${xpath.elementType_Button}`;
        }
    },
    clickOnElementType_Input: {
        value: function () {
            return this.doClick(this.elementType_Input);
        }
    },
    clickOnElementType_Button: {
        value: function () {
            return this.doClick(this.elementType_Button);
        }
    },
});
module.exports = freeFormView;


