/**
 * Created on 21.11.2018.
 */
const Page = require('../page');
const DateTimeRange = require('../components/datetime.range');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ScheduleWizardStepForm')]`,
};

class ScheduleForm extends Page {

    typeOnlineFrom(value) {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.typeOnlineFrom(value, XPATH.container);
    }

    async getOnlineFrom() {
        let dateTimeRange = new DateTimeRange();
        return await dateTimeRange.getOnlineFrom(XPATH.container);
    }

    getOnlineTo() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.getOnlineTo(XPATH.container);
    }

    typeOnlineTo(value) {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.typeOnlineTo(value, XPATH.container);
    }


    waitForValidationRecording(ms) {
        let dateTimeRange = new DateTimeRange();
        return this.waitForElementDisplayed(this.validationRecord, ms);
    }

    isValidationRecordingDisplayed() {
        let dateTimeRange = new DateTimeRange();
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.getValidationRecord(XPATH.container);
    }

    waitForDisplayed() {
        return this.waitUntilDisplayed(XPATH.container, appConst.shortTimeout);
    }

    waitForNotDisplayed() {
        return this.waitUntilElementNotVisible(XPATH.container, appConst.shortTimeout);
    }
};
module.exports = ScheduleForm;
