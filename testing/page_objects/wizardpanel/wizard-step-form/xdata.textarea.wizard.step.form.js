/**
 * Created on 24.09.2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
    textArea: `//div[contains(@id,'InputOccurrenceView')]//textarea`,
};

class XDataTextArea extends Page {

    get textAreaInput() {
        return XPATH.container + XPATH.textArea;
    }

    typeText(value) {
        return this.typeTextInInput(this.textAreaInput, value);
    }

    get validationRecord() {
        return XPATH.container + lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    getTextInTextArea() {
        return this.getTextInInput(this.textAreaInput);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    waitForTextAreaVisible() {
        return this.waitForElementDisplayed(this.textAreaInput, appConst.shortTimeout);
    }

    waitForTextAreaNotVisible() {
        return this.waitForElementNotDisplayed(this.textAreaInput, appConst.shortTimeout);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    async getValidationRecord() {
        try {
            return await this.getText(this.validationRecord);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_textarea_validation_record');
            throw new Error(`XDATA textarea, validation message, screenshot:${screenshot} ` + err);
        }
    }
}

module.exports = XDataTextArea;
