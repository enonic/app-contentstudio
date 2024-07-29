/**
 * Created on 19.08.2022
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    localeComboboxDiv: lib.FORM_VIEW + "//div[@name='localeCode2']",
    localeInput: lib.FORM_VIEW + "//input[@name='localeCode-0']",
    comboboxSelectedOption: value => `//div[contains(@id,'BaseSelectedOptionView') and child::div[contains(@class,'option-value') and text()='${value}']]`,
    comboboxOptionByName: value => `//div[contains(@class,'slick-viewport')]//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${value}']`,
};

class LocaleCodeCustomValidationForm extends Page {

    //Locales combobox, options filter input:
    get optionsFilterInput() {
        return XPATH.localeComboboxDiv + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get selectorValidationRecording() {
        return lib.FORM_VIEW_PANEL.COMBOBOX_INPUT + lib.INPUT_VALIDATION_VIEW;
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

    //Selects an option by the display name
    async typeTextAndSelectOption(optionDisplayName) {
        await this.typeTextInInput(this.optionsFilterInput, optionDisplayName);
        await this.selectOption(optionDisplayName);
        return await this.pause(300);
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

    // Select an option in filtered/expanded combobox
    async selectOption(optionDisplayName) {
        let optionSelector = XPATH.comboboxOptionByName(optionDisplayName);
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(optionSelector);
        }, {timeout: appConst.longTimeout, timeoutMsg: 'option was not found! ' + optionDisplayName});
        let optionElement = await this.getDisplayedElements(optionSelector);
        await optionElement[0].click();
        return await this.pause(300);
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
