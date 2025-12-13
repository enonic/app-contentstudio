/**
 * Created on 13.10.2021
 */

const OccurrencesFormView = require('../../wizardpanel/occurrences.form.view');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const XPATH = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class DateForm extends OccurrencesFormView {

    get dateInput() {
        return lib.FORM_VIEW + lib.DATE_PICKER_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    async typeDate(index, value) {
        let dateElements = await this.getDisplayedElements(this.dateInput);
        await dateElements[index].setValue(value);
        return await this.pause(300);
    }

    async waitForRedBorderInDateInput(index) {
        return await this.waitForRedBorderInInput(index, this.dateInput);
    }

    async getValueInDateInput(index) {
        let dateElements = await this.getDisplayedElements(this.dateInput);
        if (dateElements.length === 0) {
            throw new Error("Date inputs were not found:")
        }
        return await dateElements[index].getValue();

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
        let inputs = await this.getDisplayedElements(this.dateInput);
        if (inputs.length === 0) {
            throw new Error("Date time Form - Time inputs were not found!");
        }
        let attr = await inputs[index].getAttribute("class");
        return attr.includes("invalid");
    }

    async showPicker() {
        await this.clickOnElement(this.dateInput);
    }
}

module.exports = DateForm;
