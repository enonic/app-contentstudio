/**
 * Created on 12.10.2021
 */
const OccurrencesFormView = require('../../wizardpanel/occurrences.form.view');
const { COMMON } = require('../../../libs/elements');

const XPATH = {
    dataComponentInput: "//div[@data-component='TimeInput']",
};

class TimeForm extends OccurrencesFormView {
    get timeInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponentInput + COMMON.INPUTS.INPUT;
    }

    get validationRecord() {
        return COMMON.FORM_VIEW + XPATH.validationRecording;
    }

    async typeTime(index, value) {
        let timeElements = await this.getDisplayedElements(this.timeInput);
        for (const ch of value) {
            await timeElements[index].addValue(ch);
            await this.pause(90);
        }
    }

    async getTimes() {
        let dateTimeElements = await this.getDisplayedElements(this.timeInput);
        return await Promise.all(dateTimeElements.map((el) => el.getValue()));
    }

    async getValueInTimeInput(index) {
        let timeElements = await this.getDisplayedElements(this.timeInput);
        if (timeElements.length === 0) {
            throw new Error('Time inputs were not found:');
        }
        return await timeElements[index].getValue();
    }

    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.dateTimeInput);
        if (inputs.length === 0) {
            throw new Error('Date time Form - Time inputs were not found!');
        }
        let attr = await inputs[index].getAttribute('class');
        return attr.includes('invalid');
    }

    async showPicker() {
        await this.clickOnElement(this.timeInput);
        return this.pause(300);
    }
}

module.exports = TimeForm;
