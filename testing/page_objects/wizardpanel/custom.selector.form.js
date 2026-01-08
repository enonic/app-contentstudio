/**
 * Created on 03.06.2019.
 */
const BaseSelectorForm = require('./base.selector.form');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const CustomSelectorComboBox = require('../components/selectors/custom.selector.combobox');

const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'CustomSelector')]",
    selectedOptionByName: option => {
        return `//div[contains(@id,'CustomSelectorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
    },
};

class CustomSelectorForm extends BaseSelectorForm {

    selectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'CustomSelectorSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'CustomSelectorSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    async selectOptionByDisplayName(optionDisplayName) {
        let customSelectorComboBox = new CustomSelectorComboBox();
        return await customSelectorComboBox.selectFilteredOptionAndClickOnApply(optionDisplayName, XPATH.container);
    }

    // Clicks on the option in expanded dropdown list
    async clickOnOptionByDisplayName(optionDisplayName) {
        let customSelectorComboBox = new CustomSelectorComboBox();
        return await customSelectorComboBox.clickOnOptionByDisplayName(optionDisplayName, XPATH.container);
    }

    async waitForApplyButtonDisplayed() {
        try {
            let customSelectorComboBox = new CustomSelectorComboBox();
            return await customSelectorComboBox.waitForApplySelectionButtonDisplayed(XPATH.container);
        }catch (err){
            let screenshot = await this.saveScreenshotUniqueName('err_apply_button');
            throw new Error(`Custom Selector - Apply button is not visible, screenshot: ${screenshot}`  + err);
        }
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
            let locator = XPATH.container + lib.EMPTY_OPTIONS_H5;
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

    async clickOnDropdownHandle() {
        let customSelectorComboBox = new CustomSelectorComboBox();
        return await customSelectorComboBox.clickOnDropdownHandle(XPATH.container);
    }
}

module.exports = CustomSelectorForm;
