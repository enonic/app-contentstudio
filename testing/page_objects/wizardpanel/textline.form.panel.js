/**
 * Created on 28.12.2017.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements');
const XPATH = {
    textLine: "//div[contains(@id,'TextLine')]",
    counterElement: "//div[contains(@id,'InputValueLengthCounterEl')]",
    spanTotalCounter: "//span[@class='total-counter']",
    spanLeftCounter: "//span[contains(@class,'left-counter')]"
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

    async getTotalCounter(index) {
        let locator = "//div[contains(@id,'InputOccurrenceView')]" + XPATH.spanTotalCounter;
        let elements = await this.findElements(locator);
        if (elements.length === 0) {
            throw new Error("occurrences form - Element was not found: " + locator);
        }
        return await elements[index].getText();
    }

    async getRemaining(index) {
        let locator = "//div[contains(@id,'InputOccurrenceView')]" + XPATH.spanLeftCounter;
        let elements = await this.findElements(locator);
        if (elements.length === 0) {
            throw new Error("occurrences form - Element was not found: " + locator);
        }
        return await elements[index].getText();
    }
}

module.exports = TextLineForm;
