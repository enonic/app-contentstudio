/**
 * Created on 19.08.2022
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBoxListInput = require('../components/selectors/combobox.list.input');

const XPATH = {
    comboboxInput: "//div[@data-component='ComboBoxInput']",
    fieldErrorText: "//div[@data-component='FieldError']//span",
    selectedOptionRowByText: text =>
        `//div[@data-component='SortableGridList']/div[descendant::span[text()='${text}']]`,
    removeOccurrenceButtonByText: text =>
        `//span[text()='${text}']/parent::div/following-sibling::button[@aria-label='Remove occurrence']`,
};

class LocaleCodeCustomValidationForm extends Page {

    get localesInputText() {
        return COMMON.INPUTS.inputFieldByLabel('Locales') + "//input";
    }

    get selectorValidationRecording() {
        return XPATH.comboboxInput + XPATH.fieldErrorText;
    }

    async getSelectorValidationMessage() {
        try {
            let locator = COMMON.CONTENT_WIZARD_DATA_COMPONENT + this.selectorValidationRecording;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Error occurred while getting the validation message for the combobox', 'err_custom_validation_message',
                err);
        }
    }

    async getSelectedOption() {
        let locator = COMMON.CONTENT_WIZARD_DATA_COMPONENT + XPATH.comboboxInput +
                      "//div[@data-component='SortableGridList']/div";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInElements(locator);
    }

    //Inserts a text in the filter input then selects an option by the display name
    async typeInFilterAndClickOnOption(option) {
        let comboBoxListInput = new ComboBoxListInput();
        await comboBoxListInput.doFilterItem(option);
        // 2. Wait for the required option is displayed then click on it:
        await comboBoxListInput.clickOnOptionByDisplayName(option);
    }

    async typeTextInLocalesInput(text) {
        try {
            await this.typeChars(this.localesInputText, text);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Error occurred while typing text in text input with custom validation',
                'err_custom_validation_text_input', err);
        }
    }

    async removeSelectedOption(option) {
        try {
            let comboBoxListInput = new ComboBoxListInput();
            await comboBoxListInput.clickOnRemoveSelectedOptionButton(option);
            return await this.pause(400);
        } catch (err) {
            await this.handleError('Error occurred while removing the selected option in the combobox with custom validation',
                'err_custom_validation_remove_option', err);
        }
    }
}

module.exports = LocaleCodeCustomValidationForm;
