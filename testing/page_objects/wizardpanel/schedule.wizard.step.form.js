/**
 * Created on 21.11.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'DateTimeRange')]`,
    dateTimeRangePicker: "//div[contains(@id,'DateTimeRangePicker']",
    onlineFromDateTime: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online from']]//input[contains(@id,'TextInput')]",
    onlineToDateTime: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online to']]//input[contains(@id,'TextInput')]",
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

class ScheduleForm extends Page {

    get onlineFromDateTimeInput() {
        return XPATH.container + XPATH.onlineFromDateTime;
    }

    get onlineToDateTimeInput() {
        return XPATH.container + XPATH.onlineToDateTime;
    }

    get validationRecord() {
        return XPATH.container + XPATH.validationRecording;
    }

    typeOnlineFrom(value) {
        return this.typeTextInInput(this.onlineFromDateTimeInput, value);
    }

    async getOnlineFrom() {
        await this.waitForElementDisplayed(this.onlineFromDateTimeInput, appConst.TIMEOUT_3);
        await this.pause(300);
        return await this.getTextInInput(this.onlineFromDateTimeInput);
    }

    getOnlineTo() {
        return this.getTextInInput(this.onlineToDateTimeInput);
    }

    typeOnlineTo(value) {
        return this.typeTextInInput(this.onlineToDateTimeInput, value);
    }


    waitForValidationRecording(ms) {
        return this.waitForElementDisplayed(this.validationRecord, ms);
    }

    isValidationRecordingDisplayed() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_schedule_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }

    waitForDisplayed() {
        return this.waitUntilDisplayed(XPATH.container, appConst.TIMEOUT_2);
    }

    waitForNotDisplayed() {
        return this.waitUntilElementNotVisible(XPATH.container, appConst.TIMEOUT_2);
    }
};
module.exports = ScheduleForm;
