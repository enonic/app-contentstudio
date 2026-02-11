/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const HtmlAreaForm = require('./htmlarea.form.panel');
const TextLineForm = require('./textline.form.panel');
const DoubleForm = require('./double.form.panel');

const XPATH = {
    container: "//div[contains(@id,'FieldSetView')]",
    occurrenceView: "//div[contains(@id,'InputOccurrenceView')]",
};

class FieldSetForm extends Page {

    get htmlAreaValidationRecording() {
        return lib.FORM_VIEW_PANEL.HTML_AREA_INPUT + lib.INPUT_VALIDATION_VIEW;
    }

    get textLineValidationRecording() {
        return lib.FORM_VIEW_PANEL.TEXT_LINE_INPUT + lib.INPUT_VALIDATION_VIEW;
    }

    async typeTextInHtmlArea(text, index) {
        let htmlAreaForm = new HtmlAreaForm(XPATH.container);
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
        return await recordingElements[0].getText();
    }

    async getTextLineValidationRecording() {
        let recordingElements = await this.getDisplayedElements(this.textLineValidationRecording);
        return await recordingElements[0].getText();
    }
}

module.exports = FieldSetForm;
