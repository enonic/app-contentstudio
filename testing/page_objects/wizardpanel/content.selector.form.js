/**
 * Created on 09.07.2020.
 */

const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const BaseSelectorForm = require('./base.selector.form');
const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'ContentSelector')]",
};

class CustomSelectorForm extends BaseSelectorForm {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    selectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    getNameSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]" + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }
}

module.exports = CustomSelectorForm;
