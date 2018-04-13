/**
 * Created on 25.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const form = {
    longInput: `//div[contains(@id,'inputtype.number.long.Long')]`,
    validationRecording:`//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

const longForm = Object.create(page, {

    longInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${form.longInput}` + `${elements.TEXT_INPUT}`;
        }
    },
    validationRecord: {
        get: function () {
            return `${elements.FORM_VIEW}`+`${form.validationRecording}`;
        }
    },
    type: {
        value: function (longData) {
            return this.typeLong(longData.longValue);
        }
    },
    typeLong:{
        value:function(value){
            return this.typeTextInInput(this.longInput, value); 
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
                this.saveScreenshot('err_long_validation_record');
                throw new Error('getting Validation text: ' + err);
            })
        }
    }
});
module.exports = longForm;
