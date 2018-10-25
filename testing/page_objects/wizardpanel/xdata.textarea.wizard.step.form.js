/**
 * Created on 24.09.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const formXpath = {
    container: `//div[contains(@id,'XDataWizardStepForm')]`,
    textArea: `//div[contains(@id,'InputOccurrenceView')]//textarea`,
};
const xDataTextArea = Object.create(page, {

    textAreaInput: {
        get: function () {
            return `${formXpath.container}` + `${formXpath.textArea}`;
        }
    },
    typeText: {
        value: function (value) {
            return this.typeTextInInput(this.textAreaInput, value);
        }
    },
    getTextInTextArea: {
        value: function (value) {
            return this.getTextFromInput(this.textAreaInput);
        }
    },
    waitForValidationRecording: {
        value: function () {
            return this.waitForVisible(this.validationRecord, appConst.TIMEOUT_2);
        }
    },
    waitForTextAreaVisible: {
        value: function () {
            return this.waitForVisible(this.textAreaInput, appConst.TIMEOUT_2);
        }
    },
    waitForTextAreaNotVisible: {
        value: function () {
            return this.waitForNotVisible(this.textAreaInput, appConst.TIMEOUT_2);
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
module.exports = xDataTextArea;
