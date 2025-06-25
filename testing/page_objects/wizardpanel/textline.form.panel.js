/**
 * Created on 28.12.2017.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements-old');

const XPATH = {
    textLine: "//div[contains(@id,'TextLine')]",
    counterElement: "//div[contains(@id,'InputValueLengthCounterEl')]",
    spanTotalCounter: "//span[@class='total-counter']",
    spanLeftCounter: "//span[contains(@class,'left-counter')]",
};

class TextLineForm extends OccurrencesFormView {

    get textLineInput() {
        return lib.FORM_VIEW + XPATH.textLine + lib.TEXT_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    async getTexLineValues() {
        let values = [];
        let textLineElements = await this.getDisplayedElements(this.textLineInput);
        await Promise.all(textLineElements.map(async (el) => {
            const value = await el.getValue();
            values.push(value);
        }));
        return values;
    }

    async typeText(text, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let textLine = await this.getDisplayedElements(this.textLineInput);
        await textLine[index].setValue(text);
        return await this.pause(300);
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

    async isRedBorderDisplayed(index) {
        let inputs = await this.getDisplayedElements(this.textLineInput);
        if (inputs.length === 0) {
            throw new Error("Text line Form - text inputs were not found!");
        }
        let attr = await inputs[index].getAttribute("class");
        return attr.includes("invalid");
    }

    async isRegExStatusValid(index) {
        let locator = XPATH.textLine + "//div[contains(@class,'input-wrapper')]//input";
        let inputs = await this.getDisplayedElements(locator);
        if (inputs.length === 0) {
            throw new Error("Text line Form - text inputs were not found!");
        }
        let value = await inputs[index].getAttribute("class");
        return value.includes('valid');
    }
}

module.exports = TextLineForm;
