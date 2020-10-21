/**
 * Created on 24.09.2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
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

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_textarea_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }
}
module.exports = XDataTextArea;
