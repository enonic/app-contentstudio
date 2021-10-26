/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const HtmlAreaForm = require('./htmlarea.form.panel');
const TextLineForm = require('./textline.form.panel');
const DoubleForm = require('./double.form.panel');
const XPATH = {
    container: "//div[contains(@id,'FieldSetView')]",

    occurrenceView: "//div[contains(@id,'InputOccurrenceView')]",
};

class FieldSetForm extends Page {

    get htmlAreaValidationRecording() {
        return "//div[contains(@id,'InputView') and descendant::div[contains(@id,'HtmlArea')]]" + lib.INPUT_VALIDATION_VIEW;
    }

    get textLineValidationRecording() {
        return "//div[contains(@id,'InputView') and descendant::div[contains(@id,'TextLine')]]" + lib.INPUT_VALIDATION_VIEW;
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
        return await recordingElements[0].getText();
    }

    async getTextLineValidationRecording() {
        let recordingElements = await this.getDisplayedElements(this.textLineValidationRecording);
        return await recordingElements[0].getText();
    }
}

module.exports = FieldSetForm;
