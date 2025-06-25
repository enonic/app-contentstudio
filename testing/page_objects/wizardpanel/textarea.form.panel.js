/**
 * Created on 28.12.2017.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const XPATH = {
    textArea: `//div[contains(@id,'TextArea')]`,
};

class TextAreaForm extends OccurrencesFormView {

    get textAreaInput() {
        return lib.FORM_VIEW + XPATH.textArea + lib.TEXT_AREA;
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
}

module.exports = TextAreaForm;
