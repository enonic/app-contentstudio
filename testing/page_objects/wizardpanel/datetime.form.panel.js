/**
 * Created on 30.03.2021.
 */

const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class DateTimeForm extends Page {

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

    async getDateTimes() {
        let values = [];
        // let ids = await this.getIdInputs();
        let dateTimeElements = await this.getDisplayedElements(this.dateTimeInput);
        await Promise.all(dateTimeElements.map(async (el) => {
            const value = await el.getValue();
            values.push(value);
        }));
        return values;
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
            throw new Error("Date time Form - DateTime inputs were not found!");
        }
        let attr = await inputs[index].getAttribute("class");
        return attr.includes("invalid");
    }
}

module.exports = DateTimeForm;
