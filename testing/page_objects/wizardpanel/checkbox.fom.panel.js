/**
 * Created on 23.12.2017. updated 11.03.2026
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    checkboxComponentDiv: "//div[@data-component ='CheckboxInput']",
    titleInput: `//input[contains(@name,'title')]`,
};

class CheckBoxForm extends Page {

    get checkboxInput() {
        return XPATH.checkboxComponentDiv + COMMON.INPUTS.CHECKBOX_INPUT;
    }
    get checkboxLabel() {
        return XPATH.checkboxComponentDiv + '//label';
    }

    get formValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    async clickOnCheckbox() {
        await this.waitForElementDisplayed(this.checkboxLabel);
        return await this.clickOnElement(this.checkboxLabel);
    }

    async isCheckBoxSelected() {
        try {
            await this.waitForElementDisplayed(this.checkboxInput);
            return await this.isSelected(this.checkboxInput);
        } catch (err) {
            await this.handleError('CheckBox Form, tried to verify the checkbox input', 'err_checkbox_input', err);
        }
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should be displayed"});
    }

    async getFormValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements[0].getText();
    }

    async waitForFormValidationRecordingNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should not be displayed"});
    }


}

module.exports = CheckBoxForm;


