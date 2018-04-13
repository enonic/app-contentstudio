/**
 * Created on 28.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const form = {
    textLine: `//div[contains(@id,'inputtype.text.TextLine')]`,
    validationRecording:`//div[contains(@id,'ValidationRecordingViewer')]//li`,
};
const textLineForm = Object.create(page, {

    textLineInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.textLine}` + `${elements.TEXT_INPUT}`;
        }
    },
    validationRecord: {
        get: function () {
            return `${elements.FORM_VIEW}`+`${form.validationRecording}`;
        }
    },
    type: {
        value: function (textLineData) {
            return this.typeLong(textLineData.text);
        }
    },
    typeText:{
        value:function(value){
            return this.typeTextInInput(this.textLineInput, value);
        }
    },
    waitForValidationRecording: {
        value: function (ms) {
            return this.waitForVisible(this.validationRecord, ms);
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
                this.saveScreenshot('err_textline_validation_record');
                throw new Error('getting Validation text: ' + err);
            })
        }
    }
});
module.exports = textLineForm;
