/**
 * Created on 30.03.2021.
 */

const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const { COMMON } = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    dataComponentInput: "//div[@data-component='InstantInput' or @data-component='DateTimeInput']",
    datePickerTrigger: "//button[@data-component='DatePicker.Trigger']",
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class DateTimeForm extends OccurrencesFormView {
    get dateTimeInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponentInput + COMMON.INPUTS.INPUT;
    }

    async typeDatetime(index, value) {
        let dateTimeElements = await this.getDisplayedElements(this.dateTimeInput);
        for (const ch of value) {
            await dateTimeElements[index].addValue(ch);
            await this.pause(20);
        }
        // TODO the second option for setting values:
        // await this.getBrowser().execute((el, val) => {
        //     el.value = val;
        //     el.dispatchEvent(new Event('input', { bubbles: true }));
        //     el.dispatchEvent(new Event('change', { bubbles: true }));
        // }, dateTimeElements[index], value);
        return await this.pause(300);
    }

    // Gets array of values from DateTime inputs, if there are more than one
    async getDateTimes() {
        let values = [];
        let dateTimeElements = await this.findElements(this.dateTimeInput);
        if (dateTimeElements.length === 0) {
            throw new Error('Date time Form - DateTime inputs were not found!');
        }
        for (const item of dateTimeElements) {
            values.push(await item.getValue());
        }
        return values;
    }

    async getValueInDateTime(index) {
        let dateTimeElements = await this.getDisplayedElements(this.dateTimeInput);
        const value = await dateTimeElements[index].getValue();
        return value;
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    async showPicker(index = 0) {
        try {
            let locator = XPATH.dataComponentInput + XPATH.datePickerTrigger;
            let triggerElements = await this.getDisplayedElements(locator);
            if (triggerElements.length === 0) {
                throw new Error('DateTime Form - DatePicker.Trigger button was not found!');
            }
            await triggerElements[index].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                'DateTime Form - click on DatePicker.Trigger button',
                'err_click_on_picker_trigger',
                err,
            );
        }
    }
}

module.exports = DateTimeForm;
