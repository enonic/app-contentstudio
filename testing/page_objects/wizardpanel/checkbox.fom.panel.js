/**
 * Created on 23.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');

const XPATH = {
    checkboxDiv: "//div[contains(@id,'InputView')]//div[contains(@id,'Checkbox') and contains(@class,'checkbox')]",
    titleInput: `//input[contains(@name,'title')]`,
};

class CheckBoxForm extends Page {

    get checkbox() {
        return XPATH.checkboxDiv;
    }

    get formValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    async clickOnCheckbox() {
        await this.waitForElementDisplayed(this.checkbox, appConst.mediumTimeout);
        return await this.clickOnElement(this.checkbox + "//label");
    }

    async isCheckBoxSelected() {
        await this.waitForElementDisplayed(this.checkbox + lib.CHECKBOX_INPUT, appConst.mediumTimeout);
        return await this.isSelected(this.checkbox + lib.CHECKBOX_INPUT);
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


