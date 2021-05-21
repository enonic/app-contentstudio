/**
 * Created on 28.12.2017.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements');
const XPATH = {
    textLine: `//div[contains(@id,'TextLine')]`,
};

class TextLineForm extends OccurrencesFormView {

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
}

module.exports = TextLineForm;
