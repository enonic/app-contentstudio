/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBoxListInput = require('../components/selectors/combobox.list.input');

const XPATH = {
    container: "//div[contains(@id,'ComboBox')]",
    comboboxUL:"//ul[contains(@id,'ComboBoxList')]",
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
        let locator = lib.CONTENT_WIZARD_STEP_FORM + lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getSelectedOptionValues() {
        let locator = lib.FORM_VIEW + "//div[@class='selected-option']//div[@class='option-value']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    waitForNoOptionsSelected() {
        let locator = lib.FORM_VIEW + "//div[@class='selected-option']//div[@class='option-value']";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = ComboBoxFormPanel;
