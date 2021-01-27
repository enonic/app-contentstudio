/**
 * Created on 25.12.2017.
 */

const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    doubleInput: `//div[contains(@id,'Double')]`,
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class DoubleForm extends Page {

    get doubleInput() {
        return lib.FORM_VIEW + XPATH.doubleInput + lib.TEXT_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    type(doubleData) {
        return this.typeDouble(doubleData.doubleValue);
    }

    typeDouble(value) {
        return this.typeTextInInput(this.doubleInput, value);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_double_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }
};
module.exports = DoubleForm;
