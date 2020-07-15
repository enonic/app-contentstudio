/**
 * Created on 28.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    textLine: `//div[contains(@id,'TextLine')]`,
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class TextLineForm extends Page {

    get textLineInput() {
        return lib.FORM_VIEW + XPATH.textLine + lib.TEXT_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    type(textLineData) {
        return this.typeLong(textLineData.text);
    }

    typeText(value) {
        return this.typeTextInInput(this.textLineInput, value);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_textline_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }
};
module.exports = TextLineForm;
