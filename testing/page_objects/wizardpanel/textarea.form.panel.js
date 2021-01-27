/**
 * Created on 28.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    textArea: `//div[contains(@id,'TextArea')]`,
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class TextAreaForm extends Page {

    get textAreaInput() {
        return lib.FORM_VIEW + XPATH.textArea + lib.TEXT_AREA;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    type(textAreaData) {
        return this.typeText(textAreaData.text);
    }

    typeText(value) {
        return this.typeTextInInput(this.textAreaInput, value);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
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

};
module.exports = TextAreaForm;
