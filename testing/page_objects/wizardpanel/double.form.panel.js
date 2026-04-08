/**
 * Created on 25.12.2017. updated on 12.03.2026
 */
const OccurrencesFormView = require('./occurrences.form.view');
const {COMMON} = require('../../libs/elements');

const XPATH = {
    doubleInputDataComponent: `//input[@data-component='DoubleInput']`,
};

class DoubleForm extends OccurrencesFormView {

    get doubleInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.doubleInputDataComponent;
    }

    get removeInputButton() {
        return this.removeButton;
    }

    async typeDouble(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputs = await this.getDisplayedElements(this.doubleInput);
        for (const ch of String(value)) {
            await inputs[index].addValue(ch);
        }
        return await this.pause(300);
    }

    async setDouble(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let doubleElements = await this.getDisplayedElements(this.doubleInput);
        await doubleElements[index].setValue(value);
        return await this.pause(300);
    }

    async getDoubleInputs() {
        return await this.getDisplayedElements(this.doubleInput);
    }

    async getValueFromInput(index) {
        let doubleInputElements = await this.findElements(this.doubleInput);
        if (doubleInputElements.length === 0) {
            throw new Error('Double Form - inputs were not found!');
        }
       return await doubleInputElements[index].getValue();
    }


    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.doubleInput);
        if (inputs.length === 0) {
            throw new Error("Double Form - Double inputs were not found!");
        }
        let attr = await inputs[index].getAttribute('class');
        return attr.includes('invalid');
    }

    async clickOnRemoveIcon(index) {
        let removeButtons = await this.getDisplayedElements(this.removeInputButton);
        if (removeButtons.length === 0) {
            throw new Error("Double Form - Remove buttons were not found!");
        }
        await removeButtons[index].click();
        return await this.pause(500);
    }

    async clearDoubleInput(index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputs = await this.getDisplayedElements(this.doubleInput);
        await this.clearInputTextElement(inputs[index]);
    }
}

module.exports = DoubleForm;
