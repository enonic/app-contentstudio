/**
 * Created on 30.03.2021.
 */

const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const XPATH = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class DateTimeForm extends OccurrencesFormView {

    get dateTimeInput() {
        return lib.FORM_VIEW + lib.DATE_TIME_PICKER_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    async typeDatetime(index, value) {
        let dateTimeElements = await this.getDisplayedElements(this.dateTimeInput);
        await dateTimeElements[index].setValue(value);
        return await this.pause(300);
    }

    async waitForRedBorderDisplayedInDateTimeInput(index) {
        return await this.waitForRedBorderInInput(index, this.dateTimeInput);
    }

    async getDateTimes() {
        let values = [];
        let dateTimeElements = await this.getDisplayedElements(this.dateTimeInput);
        await Promise.all(dateTimeElements.map(async (el) => {
            const value = await el.getValue();
            values.push(value);
        }));
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
        let inputs = await this.getDisplayedElements(this.dateTimeInput);
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

module.exports = DateTimeForm;
