/**
 * Created on 12.03.2026
 */

const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    dataComponentDateInput:"//div[@role='button']//div[@data-component='DateInput'] | //div[@data-component='DateInput' and not(ancestor::div[@role='button'])]",
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class DateForm extends OccurrencesFormView {

    get dateInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT+ XPATH.dataComponentDateInput + COMMON.INPUTS.INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    async typeDate(index, value) {
        let dateElements = await this.getDisplayedElements(this.dateInput);
        for (const ch of value) {
            await dateElements[index].addValue(ch);
        }
        // await this.getBrowser().execute((el, val) => {
        //     el.value = val;
        //     el.dispatchEvent(new Event('input', { bubbles: true }));
        //     el.dispatchEvent(new Event('change', { bubbles: true }));
        // }, dateElements[index], value);
        return await this.pause(300);
    }

    async waitForRedBorderDisplayedInDateTimeInput(index) {
        return await this.waitForRedBorderInInput(index, this.dateInput);
    }

    // Gets array of values from DateTime inputs, if there are more than one
    async getDates() {
        let values = [];
        let dateTimeElements = await this.findElements(this.dateInput);
        if (dateTimeElements.length === 0) {
            throw new Error("Date time Form - DateTime inputs were not found!");
        }
        for (const item of dateTimeElements) {
            values.push(await item.getValue());
        }
        return values;
    }

    async getValueInDateInput(index) {
        let dateTimeElements = await this.getDisplayedElements(this.dateInput);
        const value = await dateTimeElements[index].getValue();
        return value;
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    async getValidationRecord() {
        try {
            await this.waitForValidationRecording();
            await this.getText(this.validationRecord);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_date_time_validation_record');
            throw new Error('getting Validation text, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.dateInput);
        if (inputs.length === 0) {
            throw new Error("Date time Form - DateTime inputs were not found!");
        }
        let attr = await inputs[index].getAttribute('class');
        return attr.includes('invalid');
    }

    async showPicker() {
        await this.clickOnElement(this.dateTimeInput);
        return await this.pause(300);
    }
}

module.exports = DateForm;
