/**
 * Created on 28.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const form = {
    textArea: `//div[contains(@id,'inputtype.text.TextArea')]`,
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};
const textAreaForm = Object.create(page, {

    textAreaInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.textArea}` + `${elements.TEXT_AREA}`;
        }
    },
    validationRecord: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.validationRecording}`;
        }
    },
    type: {
        value: function (textAreaData) {
            return this.typeText(textAreaData.text);
        }
    },
    typeText: {
        value: function (value) {
            return this.typeTextInInput(this.textAreaInput, value);
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
            return this.getText(this.validationRecord).catch(err=> {
                this.saveScreenshot('err_textarea_validation_record');
                throw new Error('getting Validation text: ' + err);
            })
        }
    }
});
module.exports = textAreaForm;
