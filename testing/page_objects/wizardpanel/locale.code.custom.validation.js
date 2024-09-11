/**
 * Created on 19.08.2022
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBoxListInput = require('../components/selectors/combobox.list.input');
const XPATH = {
    localeComboboxDiv: lib.FORM_VIEW + "//div[@name='localeCode2']",
    localeInput: lib.FORM_VIEW + "//input[@name='localeCode-0']",
    comboboxSelectedOption: value => `//div[contains(@id,'BaseSelectedOptionView') and child::div[contains(@class,'option-value') and text()='${value}']]`,
};

class LocaleCodeCustomValidationForm extends Page {

    get selectorValidationRecording() {
        return "//div[contains(@id,'InputView') and descendant::div[contains(@id,'ComboBox')]]" + lib.INPUT_VALIDATION_VIEW;
    }

    async getSelectorValidationMessage() {
        try {
            let locator = lib.CONTENT_WIZARD_STEP_FORM + this.selectorValidationRecording;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshotName = await this.saveScreenshotUniqueName('err_custom_validation');
            throw new Error("Custom validation in combobox, screenshot:  " + screenshotName + "  " + err);
        }
    }

    //Locales combobox:
    async getSelectedOption() {
        await this.waitForElementDisplayed(XPATH.comboboxSelectedOption, appConst.mediumTimeout);
        return await this.getTextInElements(XPATH.comboboxSelectedOption);
    }

    //Inserts a text in the filter input  then selects an option by the display name
    async typeInFilterAndClickOnOption(option) {
        let comboBoxListInput = new ComboBoxListInput();
        return await comboBoxListInput.selectFilteredOptionAndClickOnOk(option);
    }

    async typeTextInTextInput(text) {
        try {
            await this.typeTextInInput(XPATH.localeInput, text);
            return await this.pause(300);
        } catch (err) {
            let screenshotName = await this.saveScreenshotUniqueName('err_custom_validation');
            throw new Error("Custom validation in text input, screenshot:  " + screenshotName + "  " + err);
        }
    }

    async removeSelectedOption(option) {
        try {
            let locator = XPATH.comboboxSelectedOption(option) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(400);
        } catch (err) {
            let screenshot = this.saveScreenshotUniqueName('err_custom_validation_combo');
            throw new Error('Locale Code, custom validation, remove the selected option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = LocaleCodeCustomValidationForm;
