/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBoxListInput = require('../components/selectors/combobox.list.input');

const XPATH = {
    container: "//div[contains(@id,'ComboBox')]",
    comboBoxListInputDiv: "//div[contains(@class,'combobox-list-input')]",
    comboboxUL: "//ul[contains(@id,'ComboBoxList')]",
    inputViewValidationDiv: "//div[contains(@id,'InputViewValidationViewer')]",
    comboBoxSelectedOptionViewDiv: "//div[contains(@id,'ComboBoxSelectedOptionView')]"
};

class ComboBoxFormPanel extends Page {

    get optionFilterInput() {
        return lib.CONTENT_WIZARD_STEP_FORM + XPATH.container + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get removeOptionIcon() {
        return lib.CONTENT_WIZARD_STEP_FORM + XPATH.container + XPATH.comboBoxSelectedOptionViewDiv + lib.REMOVE_ICON;
    }

    async typeInFilterAndClickOnOption(option) {
        let comboBoxListInput = new ComboBoxListInput();
        await comboBoxListInput.selectFilteredOption(option);
    }

    async typeInFilterClickOnOptionAndApply(option) {
        let comboBoxListInput = new ComboBoxListInput();
        await comboBoxListInput.selectFilteredOptionAndClickOnApply(option);
    }

    async clickOnRemoveSelectedOptionButton(index) {
        let removeButtons = await this.getDisplayedElements(this.removeOptionIcon);
        if (removeButtons.length === 0) {
            throw new Error("ComboBox Form - Remove buttons were not found!");
        }
        await removeButtons[index].click();
        return await this.pause(500);
    }

    waitForOptionFilterInputEnabled() {
        return this.waitForElementEnabled(this.optionFilterInput, appConst.mediumTimeout);
    }

    waitForOptionFilterInputDisabled() {
        return this.waitForElementDisabled(this.optionFilterInput, appConst.mediumTimeout);
    }

    waitForOptionFilterInputNoDisplayed() {
        return this.waitForElementNotDisplayed(this.optionFilterInput, appConst.mediumTimeout);
    }

    async getComboBoxValidationMessage() {
        try {
            let locator = lib.CONTENT_WIZARD_STEP_FORM + lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('ComboBoxFormPanel - getComboBoxValidationMessage:', 'err_get_combobox_validation_message', err);
        }
    }

    async getSelectedOptionValues() {
        try {
            let locator = lib.FORM_VIEW + XPATH.comboBoxListInputDiv + "//div[contains(@class,'selected-option')]//div[@class='option-value']";
            let res = await this.findElements(locator);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            await this.handleError('ComboBoxFormPanel - getSelectedOptionValues:', 'err_get_selected_option_values', err);
        }
    }

    async waitForNoOptionsSelected() {
        try {
            let locator = lib.FORM_VIEW + XPATH.comboBoxListInputDiv + "//div[@class='selected-option']//div[@class='option-value']";
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('ComboBoxFormPanel - waitForNoOptionsSelected:', 'err_wait_for_no_options_selected', err);
        }
    }
}

module.exports = ComboBoxFormPanel;
