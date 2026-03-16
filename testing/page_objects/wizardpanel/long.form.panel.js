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
        await longElements[index].setValue(value);
        return await this.pause(300);
    }

    async waitForRedBorderInLongInput(index) {
        try {
            return await this.waitForRedBorderInInput(index, this.longInput)
        } catch (err) {
            await this.handleError('Long form, red border should be displayed','err_red_border_long', err);
        }
    }

    async waitForRedBorderNotDisplayedInLongInput(index) {
        try {
            return await this.waitForRedBorderNotDisplayedInInput(index, this.longInput)
        } catch (err) {
            await this.handleError('Long form, red border should not be displayed','err_red_border_long', err);
        }
    }
}

module.exports = LongForm;
