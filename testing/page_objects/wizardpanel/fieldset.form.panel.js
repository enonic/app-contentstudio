/**
 * Created on 15.10.2021 updated on 11.06.2026
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const HtmlAreaForm = require('./htmlarea.form.panel');
const TextLineForm = require('./textline.form.panel');
const DoubleForm = require('./double.form.panel');

const XPATH = {
    container: "//div[@data-component='FormRenderer']//fieldset",
    // InputField that contains a CKEditor html-area:
    htmlAreaInputField: "//div[@data-component='InputField' and descendant::div[@data-name='CKEditorWrapper']]",
    // InputField with a plain text input (TextLine) - Double inputs have @type='number':
    textLineInputField: "//div[@data-component='InputField' and descendant::input[not(@type)]]",
};

class FieldSetForm extends Page {

    get htmlAreaValidationRecording() {
        return XPATH.container + XPATH.htmlAreaInputField + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    get textLineValidationRecording() {
        return XPATH.container + XPATH.textLineInputField + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    async typeTextInHtmlArea(text, index) {
        let htmlAreaForm = new HtmlAreaForm();
        return await htmlAreaForm.insertTextInHtmlArea(index, text)
    }

    async typeTextInTextLine(text) {
        let textLineForm = new TextLineForm();
        return await textLineForm.typeText(text)
    }

    async typeDouble(value, index) {
        let doubleForm = new DoubleForm();
        return await doubleForm.typeDouble(value, index);
    }

    async getHtmlAreaValidationRecording() {
        let recordingElements = await this.getDisplayedElements(this.htmlAreaValidationRecording);
        if (recordingElements.length === 0) {
            throw new Error('Fieldset form - no validation recording is displayed for the html-area input');
        }
        return await recordingElements[0].getText();
    }

    async getTextLineValidationRecording() {
        let recordingElements = await this.getDisplayedElements(this.textLineValidationRecording);
        if (recordingElements.length === 0) {
            throw new Error('Fieldset form - no validation recording is displayed for the text-line input');
        }
        return await recordingElements[0].getText();
    }
}

module.exports = FieldSetForm;
