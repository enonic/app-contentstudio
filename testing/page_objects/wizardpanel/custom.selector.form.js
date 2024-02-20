/**
 * Created on 03.06.2019.
 */

const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const CustomSelectorComboBox = require('../components/selectors/custom.selector.combobox');

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

    async selectOptionByDisplayName(optionDisplayName) {
        let customSelectorComboBox = new CustomSelectorComboBox();
        return await customSelectorComboBox.selectFilteredOptionAndClickOnOk(optionDisplayName, XPATH.container);
    }

    async typeTextInOptionsFilterInput(text) {
        let customSelectorComboBox = new CustomSelectorComboBox();
        await customSelectorComboBox.filterItem(text, XPATH.container);
    }

    async getDropDownListOptions() {
        let customSelectorComboBox = new CustomSelectorComboBox();
        return await customSelectorComboBox.getOptionsName(XPATH.container);
    }

    async waitForEmptyOptionsMessage() {
        try {
            let locator = XPATH.container + lib.EMPTY_OPTIONS_DIV;
            return await this.waitForElementDisplayed(locator, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_custom_sel');
            throw new Error("Empty options text is not visible, screenshot: " + screenshot + ' ' + err);
        }
    }

    async removeSelectedOption(option) {
        let locator = XPATH.selectedOptionByName(option) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return this.pause(300);
    }

    isOptionsFilterInputDisplayed() {
        let customSelectorComboBox = new CustomSelectorComboBox();
        return customSelectorComboBox.isOptionsFilterInputDisplayed(XPATH.container);
    }
}

module.exports = CustomSelectorForm;
