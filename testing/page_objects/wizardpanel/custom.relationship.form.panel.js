/**
 * Created on 21.12.2021
 */

const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'ContentSelector')]",
    selectedOptionByName: option => {
        return `//div[contains(@id,'ContentSelector') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
    },
};

class CustomRelationshipForm extends BaseSelectorForm {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    getSelectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    async removeSelectedOption(option) {
        let locator = XPATH.selectedOptionByName(option) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }
}

module.exports = CustomRelationshipForm;
