/**
 * Created on 12.10.2021
 */
const OccurrencesFormView = require('../../wizardpanel/occurrences.form.view');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const XPATH = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class TimeForm extends OccurrencesFormView {

    get timeInput() {
        return lib.FORM_VIEW + lib.TIME_PICKER_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    async typeTime(index, value) {
        let timeElements = await this.getDisplayedElements(this.timeInput);
        await timeElements[index].setValue(value);
        return await this.pause(300);
    }

    async waitForRedBorderDisplayedInTimeInput(index) {
        return await this.waitForRedBorderInInput(index, this.timeInput);
    }

    async getTimes() {
        let values = [];
        let dateTimeElements = await this.getDisplayedElements(this.timeInput);
        await Promise.all(dateTimeElements.map(async (el) => {
            const value = await el.getValue();
            values.push(value);
        }));
        return values;
    }

    async getValueInTimeInput(index) {
        let timeElements = await this.getDisplayedElements(this.timeInput);
        if (timeElements.length === 0) {
            throw new Error("Time inputs were not found:")
        }
        return await timeElements[index].getValue();
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_date_time_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }

    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.dateTimeInput);
        if (inputs.length === 0) {
            throw new Error("Date time Form - Time inputs were not found!");
        }
        let attr = await inputs[index].getAttribute("class");
        return attr.includes("invalid");
    }

    async showPicker() {
        await this.clickOnElement(this.timeInput);
        return this.pause(300);
    }
}

module.exports = TimeForm;
