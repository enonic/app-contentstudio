/**
 * Created on 21.11.2018.
 */
const Page = require('../page');
const DateTimeRange = require('../components/datetime.range');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'ScheduleWizardStepForm')]`,
};

class ScheduleForm extends Page {

    get validationRecord() {
        return lib.FORM_VIEW + lib.OCCURRENCE_ERROR_BLOCK;
    }

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


    waitForValidationRecording() {
        let dateTimeRange = new DateTimeRange();
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
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

    waitForOnlineToInputDisplayed() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.waitForOnlineToInputDisplayed(XPATH.container);
    }

    waitForOnlineFromInputDisplayed() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.waitForOnlineFromInputDisplayed(XPATH.container);
    }
}

module.exports = ScheduleForm;
