/**
 * Created on 19.08.2022
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBoxListInput = require('../components/selectors/combobox.list.input');


class LocaleCodeCustomValidationForm extends Page {

    get localesInputText(){
        return COMMON.INPUTS.inputFieldByLabel('Locales') +"//input";
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

    //Inserts a text in the filter input  then selects an option by the display name
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
            await this.handleError('Error occurred while typing text in text input with custom validation', 'err_custom_validation_text_input', err);
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
