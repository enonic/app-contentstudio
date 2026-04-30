/**
 * Created on 28.12.2017. updated on 24.04.2026
 */
const OccurrencesFormView = require('./occurrences.form.view');
const {COMMON} = require('../../libs/elements');

const XPATH = {
    textLine: "//div[contains(@id,'TextLine')]",
    counterElement: "//div[contains(@id,'InputValueLengthCounterEl')]",
    spanTotalCounter: "//span[@class='total-counter']",
    spanLeftCounter: "//span[contains(@class,'left-counter')]",
};

class TextLineForm extends OccurrencesFormView {

    get textLineInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.DATA_COMPONENT_INPUT_FIELD + COMMON.INPUTS.INPUT;
    }

    async getValueInTextLineInput(index) {
        let dateTimeElements = await this.getDisplayedElements(this.textLineInput);
        const value = await dateTimeElements[index].getValue();
        return value;
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
        try {
            index = typeof index !== 'undefined' ? index : 0;
            let inputs = await this.getDisplayedElements(this.textLineInput);
            await inputs[index].click();
            for (const ch of String(text)) {
                await this.pause(30);
                await inputs[index].addValue(ch);
                await this.pause(30);
            }
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Text line input, ', 'err_tex_line_type', err);
        }
    }

    async setText(text, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let textLine = await this.getDisplayedElements(this.textLineInput);
        await textLine[index].setValue(text);
        return await this.pause(300);
    }

    async clearTextLine(index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputs = await this.getDisplayedElements(this.textLineInput);
        await this.clearInputTextElement(inputs[index]);
    }


    async getTotalCounter(index) {
        let locator = "//div[@data-component='SortableGridList']//span[@data-component='Counter']";
        let elements = await this.findElements(locator);
        if (elements.length === 0) {
            throw new Error("TextLine form - Counter element was not found: " + locator);
        }
        return await elements[index].getText();
    }
}

module.exports = TextLineForm;
