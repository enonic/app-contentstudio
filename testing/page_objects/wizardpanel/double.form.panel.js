/**
 * Created on 25.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const form = {
    doubleInput: `//div[contains(@id,'inputtype.number.double.Double')]`,
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

const doubleForm = Object.create(page, {

    doubleInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.doubleInput}` + `${elements.TEXT_INPUT}`;
        }
    },
    validationRecord: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.validationRecording}`;
        }
    },
    type: {
        value: function (doubleData) {
            return this.typeLong(doubleData.doubleValue);
        }
    },
    typeDouble: {
        value: function (value) {
            return this.typeTextInInput(this.doubleInput, value);
        }
    },
    waitForValidationRecording: {
        value: function () {
            return this.waitForVisible(this.validationRecord, appConst.TIMEOUT_2);
        }
    },
    isValidationRecordingVisible: {
        value: function () {
            return this.isVisible(this.validationRecord);
        }
    },
    getValidationRecord: {
        value: function () {
            return this.getText(this.validationRecord).catch(err => {
                this.saveScreenshot('err_double_validation_record');
                throw new Error('getting Validation text: ' + err);
            })
        }
    }
});
module.exports = doubleForm;


