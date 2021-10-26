/**
 * Created on 03.06.2019.
 */

const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'CustomSelector')]",
    selectedOptionByName: option => {
        return `//div[contains(@id,'CustomSelectorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
    },

};

class CustomSelectorForm extends BaseSelectorForm {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    selectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'CustomSelectorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'CustomSelectorSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    async getDropDownListOptions() {
        let loaderComboBox = new LoaderComboBox();
        let optionsLocator = XPATH.container + lib.SLICK_ROW + lib.H6_DISPLAY_NAME;
        await loaderComboBox.waitForElementDisplayed(optionsLocator, appConst.mediumTimeout);
        return await loaderComboBox.getOptionDisplayNames(XPATH.container);
    }

    async waitForEmptyOptionsMessage() {
        try {
            let locator = XPATH.container + lib.EMPTY_OPTIONS_DIV;
            return await this.waitForElementDisplayed(locator, appConst.longTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_empty_opt"));
            throw new Error("Empty options text is not visible " + err);
        }
    }

    async removeSelectedOption(option) {
        let locator = XPATH.selectedOptionByName(option) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return this.pause(300);
    }

}

module.exports = CustomSelectorForm;
