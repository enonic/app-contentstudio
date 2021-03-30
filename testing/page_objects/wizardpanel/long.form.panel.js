/**
 * Created on 25.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const XPATH = {
    longInput: "//div[contains(@id,'Long') and contains(@class,'input-type-view')]",
    validationRecording: "//div[contains(@id,'ValidationRecordingViewer')]//li",
};

class LongForm extends Page {

    get longInput() {
        return lib.FORM_VIEW + XPATH.longInput + lib.TEXT_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    type(longData) {
        return this.typeLong(longData.longValue);
    }

    typeLong(value) {
        return this.typeTextInInput(this.longInput, value);
    }

    waitForValidationRecording(ms) {
        return this.waitForElementDisplayed(this.validationRecord, ms);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_long_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }
}

module.exports = LongForm;
