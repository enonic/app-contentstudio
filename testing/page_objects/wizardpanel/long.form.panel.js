/**
 * Created on 25.12.2017.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const {COMMON} = require('../../libs/elements');
const XPATH = {
    longInputDataComponent: `//input[@data-component='LongInput']`,
};

class LongForm extends OccurrencesFormView {

    get longInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.longInputDataComponent;
    }

    //get values in occurrences of inputs
    async getLongValues() {
        let values = [];
        let longInputElements = await this.findElements(this.longInput);
        if (longInputElements.length === 0) {
            throw new Error("Long Form - long inputs were not found!");
        }
        for (const item of longInputElements) {
            values.push(await item.getValue());
        }
        return values;
    }

    async typeLong(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let longElements = await this.getDisplayedElements(this.longInput);
        for (const ch of String(value)) {
            await longElements[index].addValue(ch);
        }
        return await this.pause(300);
    }

    async setLong(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let longElements = await this.getDisplayedElements(this.longInput);
        await longElements[index].setValue(value);
        return await this.pause(300);
    }

    async clearLongInput(index) {
        index = typeof index !== 'undefined' ? index : 0;
        let longElements = await this.getDisplayedElements(this.longInput);
        await this.clearInputTextElement(longElements[index]);
    }
}

module.exports = LongForm;
